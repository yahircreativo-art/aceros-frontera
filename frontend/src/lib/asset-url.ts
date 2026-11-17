/**
 * Rutas públicas absolutas respecto a la base del sitio. Así funcionan desde
 * páginas anidadas y también cuando el sitio se publica en un subdirectorio.
 * Tolera rutas escritas a mano con `public/` al inicio.
 */
export function assetUrl(path: string): string {
  const baseUrl = import.meta.env.BASE_URL;
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const assetPath = path.replace(/^\/+/, '').replace(/^public\//, '');

  return `${base}${assetPath}`;
}

/**
 * Enlaces internos del sitio respetando la base (p. ej. GitHub Pages publica
 * en /aceros-frontera/). Solo toca rutas que empiezan con una sola "/";
 * los enlaces externos, mailto:, tel:, #ancla y rutas relativas no cambian.
 */
export function rutaInterna(href: string): string;
export function rutaInterna(href: string | undefined): string | undefined;
export function rutaInterna(href: string | undefined): string | undefined {
  if (!href || !href.startsWith('/') || href.startsWith('//')) return href;
  const baseUrl = import.meta.env.BASE_URL;
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  if (base !== '/' && href.startsWith(base)) return href;
  return `${base}${href.slice(1)}`;
}

/** Ruta actual sin la base del sitio ni la barra final (p. ej. "/catalogo"). */
export function rutaActualSinBase(pathname: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const sinBase = base && pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  return sinBase.replace(/\/$/, '') || '/';
}
