/**
 * Horarios de sucursal en el navegador: ¿está abierta ahora? (hora de
 * Tijuana) y distancia aproximada entre coordenadas.
 * Los horarios vienen de src/data/sucursales.ts con el formato
 * { dias: 'Lunes a viernes' | 'Sábado' | 'Domingo', horas: '7:30 – 17:30' }.
 */
export interface Horario { dias: string; horas: string }

const ZONA = 'America/Tijuana';

/** Día (0 = domingo) y minutos desde medianoche en Tijuana. */
export function ahoraTijuana(fecha = new Date()) {
  const partes = new Intl.DateTimeFormat('en-US', { timeZone: ZONA, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(fecha);
  const v = (t: string) => partes.find((p) => p.type === t)?.value ?? '';
  const dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(v('weekday'));
  return { dia, minutos: Number(v('hour')) * 60 + Number(v('minute')) };
}

const aMinutos = (h: string) => {
  const [hh, mm] = h.trim().split(':').map(Number);
  return hh * 60 + (mm || 0);
};
const diasDe = (texto: string): number[] => {
  const t = texto.toLowerCase();
  if (t.includes('lunes a viernes')) return [1, 2, 3, 4, 5];
  if (t.includes('lunes a sábado') || t.includes('lunes a sabado')) return [1, 2, 3, 4, 5, 6];
  if (t.includes('sábado') || t.includes('sabado')) return [6];
  if (t.includes('domingo')) return [0];
  return [];
};
const formato = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;

/** Estado actual: abierta/cerrada, cuándo cierra o cuándo abre. */
export function estado(horarios: Horario[], fecha = new Date()) {
  const { dia, minutos } = ahoraTijuana(fecha);
  const tramos = horarios.flatMap((h) => {
    const [a, c] = h.horas.split(/[–-]/).map(aMinutos);
    return diasDe(h.dias).map((d) => ({ d, a, c }));
  });
  const hoy = tramos.find((t) => t.d === dia);
  if (hoy && minutos >= hoy.a && minutos < hoy.c) {
    return { abierta: true, texto: `Abierto · cierra a las ${formato(hoy.c)}`, pronto: hoy.c - minutos <= 60 };
  }
  for (let k = 0; k < 8; k++) {
    const d = (dia + k) % 7;
    const t = tramos.find((x) => x.d === d && (k > 0 || minutos < x.a));
    if (t) {
      const cuando = k === 0 ? 'hoy' : k === 1 ? 'mañana' : ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][d];
      return { abierta: false, texto: `Cerrado · abre ${cuando} a las ${formato(t.a)}`, pronto: false };
    }
  }
  return { abierta: false, texto: 'Cerrado', pronto: false };
}

/** Distancia en km (fórmula del haversine). */
export function distanciaKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
