import { assetUrl } from './asset-url';

/** Publicidad destacada de una categoría: banner + fechas de vigencia. */
export interface Promocion {
  id: string;
  nombre: string;
  categoria: string;
  imagen: string;
  fechaInicial?: string;
  fechaCierre?: string;
  /** `true` → banner principal; `false` → cuadrícula de promociones. */
  banner?: boolean;
}

export interface ConfiguracionDestacados {
  url: string;
  clavePublica: string;
  tabla: string;
  /** Bucket público donde viven las imágenes cuando solo se cargó el nombre del archivo. */
  bucket?: string;
}

/* Nombres reales de las columnas en la tabla `Promociones`. */
const SELECT_DESTACADOS = '"Fecha inicial","Fecha cierre",Nombre,Imagen,"Categoría",Banner';
const SELECT_DESTACADOS_SIN_BANNER = '"Fecha inicial","Fecha cierre",Nombre,Imagen,"Categoría"';

interface FilaDestacado {
  'Fecha inicial'?: string | null;
  'Fecha cierre'?: string | null;
  Nombre?: string | null;
  Imagen?: string | null;
  'Categoría'?: string | null;
  Categoria?: string | null;
  Banner?: boolean | string | number | null;
}

/** Acepta booleanos, `TRUE`/`FALSE`, `1`/`0`, `t`/`f` y `si`/`no`. */
function aBooleano(valor: unknown): boolean {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'number') return valor !== 0;

  const texto = String(valor ?? '').trim().toLowerCase();
  return ['true', 't', '1', 'si', 'sí', 'yes'].includes(texto);
}

function normalizarImagen(imagen?: string | null): string {
  const limpia = (imagen ?? '').trim();
  if (!limpia) return '';

  if (/^https?:\/\//i.test(limpia)) {
    const archivo = limpia.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (archivo) return `https://drive.google.com/thumbnail?id=${archivo[1]}&sz=w1600`;

    if (limpia.includes('/folders/')) return '';

    return limpia;
  }

  return assetUrl(limpia);
}

/** Si en `Nombre` solo hay un archivo, se arma la URL pública del bucket. */
function imagenDesdeNombre(nombre: string, url: string, bucket?: string): string {
  if (!bucket) return '';
  if (!/\.(webp|png|jpe?g|avif|gif)$/i.test(nombre)) return '';

  return `${url.replace(/\/+$/, '')}/storage/v1/object/public/${bucket}/${encodeURIComponent(nombre)}`;
}

function crearId(fila: FilaDestacado, indice: number): string {
  const base = `${fila.Nombre ?? ''}-${fila['Fecha inicial'] ?? ''}-${indice}`;
  return base
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `destacado-${indice + 1}`;
}

export async function obtenerDestacadosSupabase(
  configuracion: ConfiguracionDestacados,
): Promise<Promocion[]> {
  if (!/^[a-zA-Z_][a-zA-Z\d_]*$/.test(configuracion.tabla)) {
    throw new Error('SUPABASE_DESTACADOS_TABLE no es un nombre de tabla válido.');
  }

  const base = `${configuracion.url.replace(/\/+$/, '')}/rest/v1/${configuracion.tabla}`;

  const pedir = (select: string) => {
    const url = new URL(base);
    url.searchParams.set('select', select);
    url.searchParams.set('limit', '100');

    return fetch(url, {
      headers: {
        apikey: configuracion.clavePublica,
        Authorization: `Bearer ${configuracion.clavePublica}`,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
  };

  // Si la tabla todavía no tiene la columna `Banner`, se sigue funcionando con
  // el comportamiento anterior (todas las promociones van al banner principal).
  let tieneBanner = true;
  let respuesta = await pedir(SELECT_DESTACADOS);

  if (respuesta.status === 400) {
    tieneBanner = false;
    respuesta = await pedir(SELECT_DESTACADOS_SIN_BANNER);
  }

  if (!respuesta.ok) {
    throw new Error(`Supabase respondió ${respuesta.status}: ${await respuesta.text()}`);
  }

  const data = (await respuesta.json()) as FilaDestacado[];
  if (!Array.isArray(data)) {
    throw new Error('Supabase devolvió un formato de destacados inesperado.');
  }

  return data
    .map((fila, indice) => {
      const nombre = String(fila.Nombre ?? '').trim();
      const imagenDirecta = normalizarImagen(fila.Imagen);

      const esArchivo = /\.(webp|png|jpe?g|avif|gif)$/i.test(nombre);

      return {
        id: crearId(fila, indice),
        // Si en `Nombre` solo hay un archivo, la imagen ya trae el mensaje:
        // no se repite como título encima del banner.
        nombre: esArchivo ? '' : nombre,
        categoria: String(fila['Categoría'] ?? fila.Categoria ?? '').trim(),
        imagen:
          imagenDirecta || imagenDesdeNombre(nombre, configuracion.url, configuracion.bucket),
        fechaInicial: fila['Fecha inicial'] ?? undefined,
        fechaCierre: fila['Fecha cierre'] ?? undefined,
        banner: tieneBanner ? aBooleano(fila.Banner) : true,
      };
    })
    .filter((promocion) => Boolean(promocion.nombre || promocion.categoria));
}
