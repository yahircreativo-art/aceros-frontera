import seo from '../data/seo.json';

export type PageId = keyof typeof seo.pages;
export type PageSeo = (typeof seo.pages)[PageId];

export const siteSeo = seo.site;

export function whatsappUrl(mensaje: string = seo.site.whatsappMessage): string {
  return `https://wa.me/${seo.site.whatsapp}?text=${encodeURIComponent(mensaje)}`;
}

/** Corta en el último espacio antes de `max` para no partir palabras en títulos y descripciones. */
export function recortarTexto(texto: string, max: number): string {
  const limpio = texto.replace(/\s+/g, ' ').trim();
  if (limpio.length <= max) return limpio;
  const corte = limpio.slice(0, max - 1);
  return `${corte.slice(0, corte.lastIndexOf(' ') > 0 ? corte.lastIndexOf(' ') : corte.length).replace(/[,;:.\s-]+$/, '')}…`;
}

/** "ABRAZADERA DE ARRANQUE 1 3/8" → "Abrazadera de arranque 1 3/8". */
export function nombreLegible(nombre: string): string {
  const minus = nombre.trim().toLocaleLowerCase('es-MX');
  return minus.charAt(0).toLocaleUpperCase('es-MX') + minus.slice(1);
}

/** Ciudades con sucursal, para textos SEO locales. */
export const ciudadesSeo = 'Tijuana, Mexicali y Ensenada';
