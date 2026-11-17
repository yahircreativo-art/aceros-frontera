import { slugCategoria } from './categorias';
import type { Producto } from './types';

/**
 * Identificador de la subpágina de un producto: nombre legible + SKU
 * (p. ej. "abrazadera-de-tension-1-7-8-02-abten-178"). Sin SKU usa el ID.
 */
export function slugProducto(producto: Producto): string {
  const nombre = slugCategoria(String(producto.Nombre ?? 'producto')).slice(0, 60).replace(/-+$/, '');
  const clave = producto.SKU ?? producto.ID;
  return clave != null && String(clave).trim() ? `${nombre}-${slugCategoria(String(clave))}` : nombre;
}

/** Ruta (sin base) de la subpágina del producto. */
export function rutaProducto(producto: Producto): string {
  return `/producto/${slugProducto(producto)}`;
}

/** Los textos de Supabase traen el SKU repetido al final; ya se muestra aparte. */
export function sinSkuFinal(texto?: string | null): string {
  return String(texto ?? '')
    .replace(/\s*\|?\s*SKU:.*$/i, '')
    .trim();
}
