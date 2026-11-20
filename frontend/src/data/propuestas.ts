/**
 * Secciones de la portada con variantes de diseño (A–L) y la que está
 * publicada. La vista /propuestas/ genera una página por variante para
 * compararlas sin tocar el sitio.
 * Para publicar otra variante: cambia `actual` aquí y el import en
 * src/pages/index.astro.
 */
export type SeccionPropuesta = 'navbar' | 'hero' | 'nosotros' | 'catalogo' | 'resenas' | 'contacto' | 'footer' | 'servicios';

export interface Propuesta {
  id: SeccionPropuesta;
  titulo: string;
  letras: string[];
  /** Variante publicada en la portada ('' = sección aún sin publicar). */
  actual: string;
  /** Texto del resumen cuando `actual` es '' (por defecto "sin publicar"). */
  sinVariante?: string;
}

export const propuestas: Propuesta[] = [
  { id: 'navbar', titulo: 'Navbar', letras: ['A', 'B', 'C', 'D', 'E'], actual: 'E' },
  { id: 'hero', titulo: 'Hero', letras: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'], actual: 'M' },
  { id: 'nosotros', titulo: 'Nosotros', letras: ['A', 'B', 'C', 'D', 'E'], actual: 'C' },
  { id: 'catalogo', titulo: 'Catálogo', letras: ['A', 'B', 'C', 'D', 'E'], actual: 'C' },
  /* '' = la sección de siempre (components/home/Servicios.astro). */
  { id: 'servicios', titulo: 'Servicios', letras: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'], actual: 'F', sinVariante: 'la actual' },
  /* Publicada la G, pero las reseñas de src/data/resenas.ts todavía son de ejemplo (sale el aviso). */
  { id: 'resenas', titulo: 'Reseñas', letras: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], actual: 'G' },
  { id: 'contacto', titulo: 'Contacto', letras: ['A', 'B', 'C', 'D', 'E'], actual: 'D' },
  /* '' = el footer de siempre (components/Footer.astro), que siguen usando las demás páginas. */
  { id: 'footer', titulo: 'Footer', letras: ['A', 'B', 'C', 'D', 'E'], actual: 'D', sinVariante: 'el actual' },
];

export type Seleccion = Record<SeccionPropuesta, string>;

export const seleccionActual = (): Seleccion =>
  Object.fromEntries(propuestas.map((p) => [p.id, p.actual])) as Seleccion;

/** Ruta (sin base) de la vista de una variante: la publicada es /propuestas/. */
export function rutaPropuesta(seccion: SeccionPropuesta, letra: string): string {
  const p = propuestas.find((x) => x.id === seccion);
  return !p || p.actual === letra ? '/propuestas/' : `/propuestas/${seccion}-${letra.toLowerCase()}/`;
}
