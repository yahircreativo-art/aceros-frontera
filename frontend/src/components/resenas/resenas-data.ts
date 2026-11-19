/**
 * Datos compartidos por las propuestas de Reseñas A–E. Las reseñas viven en
 * src/data/resenas.ts (hoy son de ejemplo: ver el aviso de ese archivo).
 */
import { sucursales } from '../../data/sucursales';
import { resenas, fichaGoogle, hayResenasDeEjemplo, temas, type Resena } from '../../data/resenas';

export { resenas, fichaGoogle, hayResenasDeEjemplo, temas, type Resena };

/** Solo las de 5 estrellas, como pidió el negocio. */
export const resenas5 = resenas.filter((r) => r.estrellas === 5);

export const sucursalDe = (r: Resena) =>
  sucursales.find((s) => s.id === r.sucursal)?.nombre ?? '';

const sucursalFicha = sucursales.find((s) => s.id === fichaGoogle.sucursal)!;

/** "4,5" */
export const calificacionTexto = fichaGoogle.calificacion.toLocaleString('es-MX', { minimumFractionDigits: 1 });

/** Dato real para la cota: "4,5 estrellas en Google, sucursal Cucapah" */
export const cotaGoogle = `${calificacionTexto} estrellas en Google, ${sucursalFicha.nombre.replace(/^Sucursal/, 'sucursal')}`;

/** Iniciales para el avatar: "Cliente de ejemplo 3" → "C3" */
export const iniciales = (nombre: string) => {
  const p = nombre.trim().split(/\s+/);
  return (p[0][0] + (p.length > 1 ? p.at(-1)![0] : '')).toUpperCase();
};
