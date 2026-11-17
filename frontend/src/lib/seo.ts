import seo from '../data/seo.json';

export type PageId = keyof typeof seo.pages;
export type PageSeo = (typeof seo.pages)[PageId];

export const siteSeo = seo.site;

export function whatsappUrl(mensaje: string = seo.site.whatsappMessage): string {
  return `https://wa.me/${seo.site.whatsapp}?text=${encodeURIComponent(mensaje)}`;
}
