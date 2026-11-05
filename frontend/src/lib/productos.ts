import { getCollection } from 'astro:content';
import { assetUrl } from './asset-url';
import { obtenerProductosSupabase } from './supabase-productos';
import type { Producto } from './types';

/* Supabase es la fuente remota opcional; Markdown local sigue como respaldo
   para que el build también funcione sin credenciales o conexión. */
const SUPABASE_URL = (import.meta.env.SUPABASE_URL as string | undefined)?.replace(/\/+$/, '');
const SUPABASE_ANON_KEY = import.meta.env.SUPABASE_ANON_KEY as string | undefined;
const SUPABASE_PRODUCTS_TABLE =
  (import.meta.env.SUPABASE_PRODUCTS_TABLE as string | undefined) ?? 'productos';

function normalizarImagen(imagen: string): string {
  if (/^https?:\/\//i.test(imagen)) return imagen;
  return assetUrl(imagen.replace(/\.(?:png|jpe?g)$/i, '.webp'));
}

function ordenar(a: Producto, b: Producto): number {
  return Number(b.destacado) - Number(a.destacado) || a.nombre.localeCompare(b.nombre, 'es');
}

async function desdeSupabase(): Promise<Producto[] | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  try {
    return await obtenerProductosSupabase({
      url: SUPABASE_URL,
      clavePublica: SUPABASE_ANON_KEY,
      tabla: SUPABASE_PRODUCTS_TABLE,
    });
  } catch (error) {
    console.warn('[catálogo] Supabase no disponible; se usa el catálogo Markdown.', error);
    return null;
  }
}

async function desdeMarkdown(): Promise<Producto[]> {
  const entries = await getCollection('productos');

  return entries.map((entry) => ({
    slug: entry.id,
    ...entry.data,
    imagen: normalizarImagen(entry.data.imagen),
  }));
}

export async function obtenerProductos(): Promise<Producto[]> {
  const productos = (await desdeSupabase()) ?? (await desdeMarkdown());
  return productos.sort(ordenar);
}
