import { obtenerProductosSupabase } from './supabase-productos';
import type { Producto } from './types';

const SUPABASE_URL = (import.meta.env.SUPABASE_URL as string | undefined)?.trim().replace(/\/+$/, '');
/* trim(): una clave pegada con salto de línea rompe la cabecera de la petición. */
const SUPABASE_ANON_KEY = (import.meta.env.SUPABASE_ANON_KEY as string | undefined)?.trim();
export const SUPABASE_PRODUCTS_TABLE =
  (import.meta.env.SUPABASE_PRODUCTS_TABLE as string | undefined)?.trim() || 'MASTER_PRODUCTOS';

/* Cada página y cada getStaticPaths piden el catálogo: se descarga una sola vez por build. */
let pendiente: Promise<Producto[]> | null = null;

export function obtenerProductos(): Promise<Producto[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return Promise.resolve([]);

  pendiente ??= obtenerProductosSupabase({
    url: SUPABASE_URL,
    clavePublica: SUPABASE_ANON_KEY,
    tabla: SUPABASE_PRODUCTS_TABLE,
  }).catch((error) => {
    /* Si Supabase falla, el sitio se publica con el catálogo vacío en lugar de romper el build. */
    console.warn(`[productos] No se pudo leer Supabase, catálogo vacío: ${error instanceof Error ? error.message : error}`);
    return [];
  });

  return pendiente;
}

/** Categorías únicas del catálogo, ordenadas. Reutiliza la misma descarga. */
export async function obtenerCategorias(): Promise<string[]> {
  const productos = await obtenerProductos();
  return [...new Set(productos.map((p) => String(p.Categoria ?? '').trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'es'),
  );
}

/** Solo los campos que usan las tarjetas del catálogo (sin la descripción larga), para no inflar el HTML de las islas. */
export function paraTarjetas(productos: Producto[]): Producto[] {
  return productos.map(({ Descripcion: _descripcion, ...resto }) => ({ ...resto, Descripcion: null }));
}
