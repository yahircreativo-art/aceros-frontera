import { getCollection } from 'astro:content';
import { assetUrl } from './asset-url';
import type { Producto } from './types';

/* Supabase es la fuente remota opcional; Markdown local sigue como respaldo
   para que el build también funcione sin credenciales o conexión. */
const SUPABASE_URL = (import.meta.env.SUPABASE_URL as string | undefined)?.replace(/\/+$/, '');
const SUPABASE_ANON_KEY = import.meta.env.SUPABASE_ANON_KEY as string | undefined;
const SUPABASE_PRODUCTS_TABLE =
  (import.meta.env.SUPABASE_PRODUCTS_TABLE as string | undefined) ?? 'productos';

interface ProductoSupabase {
  id?: number;
  sku?: string;
  nombre: string;
  marca?: string;
  categoria: string;
  precio?: number | null;
  stock?: boolean | null;
  imagen: string;
  resumen: string;
}

function normalizarImagen(imagen: string): string {
  if (/^https?:\/\//i.test(imagen)) return imagen;
  return assetUrl(imagen.replace(/\.(?:png|jpe?g)$/i, '.webp'));
}

function ordenar(a: Producto, b: Producto): number {
  return Number(b.destacado) - Number(a.destacado) || a.nombre.localeCompare(b.nombre, 'es');
}

async function desdeSupabase(): Promise<Producto[] | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!/^[a-zA-Z_][a-zA-Z\d_]*$/.test(SUPABASE_PRODUCTS_TABLE)) {
    console.warn(
      '[catálogo] SUPABASE_PRODUCTS_TABLE no es un nombre de tabla válido; se usa Markdown.',
    );
    return null;
  }

  try {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${SUPABASE_PRODUCTS_TABLE}`);
    url.searchParams.set('select', 'id,sku,nombre,marca,categoria,precio,stock,imagen,resumen');
    url.searchParams.set('order', 'nombre.asc');
    url.searchParams.set('limit', '200');

    const respuesta = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!respuesta.ok) {
      console.warn(`[catálogo] Supabase respondió ${respuesta.status}; se usa Markdown.`);
      return null;
    }

    const data = (await respuesta.json()) as ProductoSupabase[];
    if (!Array.isArray(data)) {
      console.warn('[catálogo] Supabase devolvió un formato inesperado; se usa Markdown.');
      return null;
    }

    return data.map((item) => ({
      slug: String(item.id ?? item.sku ?? item.nombre),
      sku: item.sku,
      nombre: item.nombre,
      marca: item.marca,
      categoria: item.categoria,
      precio: item.precio ?? undefined,
      rating: 4.5,
      reviews: 0,
      stock: item.stock ?? undefined,
      envioGratis: false,
      destacado: false,
      imagen: normalizarImagen(item.imagen),
      etiquetas: [],
      resumen: item.resumen,
    }));
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
