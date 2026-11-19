/**
 * Secciones de la portada con variantes de diseño (A–G) y la que está
 * publicada. La vista /propuestas/ genera una página por variante para
 * compararlas sin tocar el sitio.
 * Para publicar otra variante: cambia `actual` aquí y el import en
 * src/pages/index.astro.
 */
export type SeccionPropuesta = 'navbar' | 'hero' | 'nosotros' | 'catalogo' | 'contacto';

export interface Propuesta {
  id: SeccionPropuesta;
  titulo: string;
  letras: string[];
  /** Variante publicada en la portada. */
  actual: string;
}

export const propuestas: Propuesta[] = [
  { id: 'navbar', titulo: 'Navbar', letras: ['A', 'B', 'C', 'D', 'E'], actual: 'C' },
  { id: 'hero', titulo: 'Hero', letras: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], actual: 'G' },
  { id: 'nosotros', titulo: 'Nosotros', letras: ['A', 'B', 'C', 'D', 'E'], actual: 'A' },
  { id: 'catalogo', titulo: 'Catálogo', letras: ['A', 'B', 'C', 'D', 'E'], actual: 'B' },
  { id: 'contacto', titulo: 'Contacto', letras: ['A', 'B', 'C', 'D', 'E'], actual: 'D' },
];

export type Seleccion = Record<SeccionPropuesta, string>;

export const seleccionActual = (): Seleccion =>
  Object.fromEntries(propuestas.map((p) => [p.id, p.actual])) as Seleccion;

/** Ruta (sin base) de la vista de una variante: la publicada es /propuestas/. */
export function rutaPropuesta(seccion: SeccionPropuesta, letra: string): string {
  const p = propuestas.find((x) => x.id === seccion);
  return !p || p.actual === letra ? '/propuestas/' : `/propuestas/${seccion}-${letra.toLowerCase()}/`;
}
