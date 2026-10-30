/**
 * Rutas relativas al sitio: funcionan igual con SITE_BASE_PATH vacío o con un
 * subdirectorio. Tolera rutas escritas a mano con `public/` al inicio (error
 * común en el frontmatter) para que no se rompan en producción.
 */
export function assetUrl(path: string): string {
  return path.replace(/^\/+/, '').replace(/^public\//, '');
}
