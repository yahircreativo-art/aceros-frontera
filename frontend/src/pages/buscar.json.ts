import type { APIRoute } from 'astro';
import { obtenerProductos } from '../lib/productos';
import { rutaProducto } from '../lib/rutas-producto';

/**
 * Índice ligero para el buscador del encabezado. Se descarga una sola vez,
 * al enfocar el buscador, en lugar de incrustar el catálogo completo en cada página.
 * n = nombre, s = SKU, c = categoría, r = ruta (sin base).
 */
export const GET: APIRoute = async () => {
  const productos = await obtenerProductos();
  const vistos = new Set<string>();
  const indice = productos.flatMap((p) => {
    if (!p.Nombre) return [];
    const r = rutaProducto(p);
    if (vistos.has(r)) return [];
    vistos.add(r);
    return [{ n: p.Nombre, s: p.SKU != null ? String(p.SKU) : '', c: String(p.Categoria ?? '').trim(), r }];
  });

  return new Response(JSON.stringify(indice), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
