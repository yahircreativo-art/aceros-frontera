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
