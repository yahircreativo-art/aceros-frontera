import { obtenerProductosSupabase } from './supabase-productos';
import type { Producto } from './types';

const SUPABASE_URL = (import.meta.env.SUPABASE_URL as string | undefined)?.trim().replace(/\/+$/, '');
/* trim(): una clave pegada con salto de línea rompe la cabecera de la petición. */
const SUPABASE_ANON_KEY = (import.meta.env.SUPABASE_ANON_KEY as string | undefined)?.trim();
const SUPABASE_PRODUCTS_TABLE = 'MASTER_PRODUCTOS';

export async function obtenerProductos(): Promise<Producto[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return [];
  }

  const productos = await obtenerProductosSupabase({
    url: SUPABASE_URL,
    clavePublica: SUPABASE_ANON_KEY,
    tabla: SUPABASE_PRODUCTS_TABLE,
  });

  return productos;
}
