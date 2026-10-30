import { getCollection } from 'astro:content';
import { assetUrl } from './asset-url';
import type { Producto } from './types';

/* Fuente del catálogo:
   1. Strapi (STRAPI_URL) si está configurado y responde.
   2. Markdown local (src/content/catalogo) como respaldo, para que el build
      nunca dependa de que el backend esté encendido. */

const STRAPI_URL = (import.meta.env.STRAPI_URL as string | undefined)?.replace(/\/+$/, '');
const STRAPI_TOKEN = import.meta.env.STRAPI_TOKEN as string | undefined;

interface ProductoStrapi {
  id: number;
  slug?: string;
  sku?: string;
  nombre: string;
  marca?: string;
  categoria: string;
  precio?: number;
  precioAnterior?: number;
  rating?: number;
  reviews?: number;
  stock?: number;
  envioGratis?: boolean;
  destacado?: boolean;
  imagen: string;
  etiquetas?: string[] | null;
  resumen: string;
  especificaciones?: Record<string, string> | null;
}

function normalizarImagen(imagen: string): string {
  return assetUrl(imagen.replace(/\.(?:png|jpe?g)$/i, '.webp'));
}

function ordenar(a: Producto, b: Producto): number {
  return Number(b.destacado) - Number(a.destacado) || a.nombre.localeCompare(b.nombre, 'es');
}

async function desdeStrapi(): Promise<Producto[] | null> {
  if (!STRAPI_URL) return null;

  try {
    const url = new URL(`${STRAPI_URL}/api/productos`);
    url.searchParams.set('pagination[pageSize]', '200');
    url.searchParams.set('sort', 'nombre:asc');

    const respuesta = await fetch(url, {
      headers: STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {},
      signal: AbortSignal.timeout(5000),
    });

    if (!respuesta.ok) {
      console.warn(`[catálogo] Strapi respondió ${respuesta.status}; se usa Markdown.`);
      return null;
    }

    const { data } = (await respuesta.json()) as { data: ProductoStrapi[] };

    return data.map((item) => ({
      slug: item.slug ?? String(item.id),
      sku: item.sku,
      nombre: item.nombre,
      marca: item.marca,
      categoria: item.categoria,
      precio: item.precio,
      precioAnterior: item.precioAnterior,
      rating: item.rating ?? 4.5,
      reviews: item.reviews ?? 0,
      stock: item.stock ?? 0,
      envioGratis: item.envioGratis ?? false,
      destacado: item.destacado ?? false,
      imagen: normalizarImagen(item.imagen),
      etiquetas: item.etiquetas ?? [],
      resumen: item.resumen,
      especificaciones: item.especificaciones ?? undefined,
    }));
  } catch (error) {
    console.warn('[catálogo] Strapi no disponible; se usa el catálogo Markdown.', error);
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
  const productos = (await desdeStrapi()) ?? (await desdeMarkdown());
  return productos.sort(ordenar);
}
