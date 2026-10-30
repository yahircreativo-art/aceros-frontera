import seo from '../data/seo.json';

export type PageId = keyof typeof seo.pages;
export type PageSeo = (typeof seo.pages)[PageId];

export const siteSeo = seo.site;
export const pageSeo = seo.pages;

export function absoluteUrl(path: string): string {
  return new URL(path, seo.site.baseUrl).toString();
}

export function whatsappUrl(mensaje: string = seo.site.whatsappMessage): string {
  return `https://wa.me/${seo.site.whatsapp}?text=${encodeURIComponent(mensaje)}`;
}
