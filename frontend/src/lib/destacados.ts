import { obtenerDestacadosSupabase, type Promocion } from './supabase-destacados';

export type { Promocion };

const SUPABASE_URL = (import.meta.env.SUPABASE_URL as string | undefined)?.trim().replace(/\/+$/, '');
/* trim(): una clave pegada con salto de línea rompe la cabecera de la petición. */
const SUPABASE_ANON_KEY = (import.meta.env.SUPABASE_ANON_KEY as string | undefined)?.trim();
const SUPABASE_DESTACADOS_TABLE =
  (import.meta.env.SUPABASE_DESTACADOS_TABLE as string | undefined) ?? 'Promociones';
const SUPABASE_PROMOS_BUCKET =
  (import.meta.env.SUPABASE_PROMOS_BUCKET as string | undefined) ?? 'Productos-imagenes';

/* Zona de la empresa: los cortes de fecha se calculan en Tijuana, no con la
   hora del equipo que visita el sitio. */
const ZONA_TIJUANA = 'America/Tijuana';
const ISO_CON_ZONA =
  /^\d{4}-\d{1,2}-\d{1,2}[T ]\d{1,2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}(?::?\d{2})?)$/i;

/** Partes de la fecha tal como vienen escritas en la columna. */
interface PartesFecha {
  anio: number;
  mes: number;
  dia: number;
  hora: number;
  minuto: number;
}

/** Desfase de Tijuana respecto a UTC, en minutos, para un instante dado. */
function desfaseTijuana(instante: number): number {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_TIJUANA,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instante));

  const dato = (tipo: Intl.DateTimeFormatPartTypes) =>
    Number(partes.find((parte) => parte.type === tipo)?.value ?? 0);

  const comoUtc = Date.UTC(
    dato('year'),
    dato('month') - 1,
    dato('day'),
    dato('hour'),
    dato('minute'),
    dato('second'),
  );

  return (comoUtc - Math.floor(instante / 1000) * 1000) / 60_000;
}

/** Instante UTC que corresponde a una hora de reloj en Tijuana. */
function enTijuana(
  anio: number,
  mes: number,
  dia: number,
  hora = 0,
  minuto = 0,
  segundo = 0,
  milisegundo = 0,
): number {
  const ingenuo = Date.UTC(anio, mes - 1, dia, hora, minuto, segundo, milisegundo);
  const primeraAproximacion = ingenuo - desfaseTijuana(ingenuo) * 60_000;
  // El desfase cambia con el horario de verano: se recalcula en el instante resultante.
  return ingenuo - desfaseTijuana(primeraAproximacion) * 60_000;
}

/** Lee año, mes, día y hora de una fecha ISO o `dd/mm/aaaa`. */
function partesFecha(valor?: string | null): PartesFecha | null {
  const texto = String(valor ?? '').trim();
  if (!texto) return null;

  const iso = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2}))?/);
  if (iso) {
    return {
      anio: Number(iso[1]),
      mes: Number(iso[2]),
      dia: Number(iso[3]),
      hora: Number(iso[4] ?? 0),
      minuto: Number(iso[5] ?? 0),
    };
  }

  const local = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[T ](\d{1,2}):(\d{2}))?/);
  if (local) {
    return {
      anio: Number(local[3]),
      mes: Number(local[2]),
      dia: Number(local[1]),
      hora: Number(local[4] ?? 0),
      minuto: Number(local[5] ?? 0),
    };
  }

  return null;
}

/**
 * Convierte el texto de las columnas de fecha en milisegundos, interpretando el
 * día/hora escritos como hora de Tijuana. Acepta ISO (`2026-11-10`,
 * `2026-11-10T18:00`) y `10/11/2026` o `10/11/2026 18:00`.
 */
export function aFecha(valor?: string | null): number | null {
  const texto = String(valor ?? '').trim();

  if (ISO_CON_ZONA.test(texto)) {
    const instante = Date.parse(texto);
    return Number.isNaN(instante) ? null : instante;
  }

  const partes = partesFecha(valor);
  if (partes) {
    return enTijuana(partes.anio, partes.mes, partes.dia, partes.hora, partes.minuto);
  }

  if (!texto) return null;

  const generica = Date.parse(texto);
  return Number.isNaN(generica) ? null : generica;
}

function finDelDia(valor?: string | null): number | null {
  const fecha = aFecha(valor);
  if (fecha === null) return null;

  const partes = partesFecha(valor);
  if (!partes || ISO_CON_ZONA.test(String(valor ?? '').trim())) return fecha;

  // Las fechas de calendario (sin hora, o guardadas como timestamp a las 00:00)
  // vencen al final de ese día en Tijuana: 23:59:59.999.
  const tieneHora = partes.hora !== 0 || partes.minuto !== 0;
  if (tieneHora) return fecha;

  return enTijuana(partes.anio, partes.mes, partes.dia, 23, 59, 59, 999);
}

/** Una publicidad se muestra mientras la fecha actual esté dentro de su rango. */
export function esPromocionActiva(promocion: Promocion, ahora = Date.now()): boolean {
  const inicio = aFecha(promocion.fechaInicial);
  const cierre = finDelDia(promocion.fechaCierre);

  if (inicio !== null && ahora < inicio) return false;
  if (cierre !== null && ahora >= cierre) return false;
  return true;
}

/** Próximo instante en que una promoción cambia de estado. */
export function proximaFechaCambio(
  promociones: Promocion[],
  ahora = Date.now(),
): number | null {
  const cambios: number[] = [];

  for (const promocion of promociones) {
    const inicio = aFecha(promocion.fechaInicial);
    const cierre = finDelDia(promocion.fechaCierre);

    if (inicio !== null && inicio > ahora) cambios.push(inicio);
    if (cierre !== null && cierre >= ahora) cambios.push(cierre);
  }

  return cambios.length ? Math.min(...cambios) : null;
}

/** `Banner = TRUE` va al carrusel principal; `FALSE` a la cuadrícula. */
export function esBanner(promocion: Promocion): boolean {
  return promocion.banner !== false;
}

export function filtrarPromociones<T extends Promocion>(
  promociones: T[],
  ahora = Date.now(),
): T[] {
  return promociones
    // Sin imagen la publicidad no se puede mostrar como banner.
    .filter((promocion) => Boolean(promocion.imagen))
    .filter((promocion) => esPromocionActiva(promocion, ahora))
    .sort((a, b) => (aFecha(a.fechaInicial) ?? 0) - (aFecha(b.fechaInicial) ?? 0));
}

/** Publicidades vigentes leídas en el servidor (build o petición en desarrollo). */
export async function obtenerPromociones(): Promise<Promocion[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];

  try {
    const promociones = await obtenerDestacadosSupabase({
      url: SUPABASE_URL,
      clavePublica: SUPABASE_ANON_KEY,
      tabla: SUPABASE_DESTACADOS_TABLE,
      bucket: SUPABASE_PROMOS_BUCKET,
    });

    return filtrarPromociones(promociones);
  } catch (error) {
    console.warn('[catálogo] No se pudieron cargar las publicidades destacadas.', error);
    return [];
  }
}

export { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_DESTACADOS_TABLE, SUPABASE_PROMOS_BUCKET };
