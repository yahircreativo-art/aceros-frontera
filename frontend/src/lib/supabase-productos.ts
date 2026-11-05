import { assetUrl } from './asset-url';
import type { Producto } from './types';

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

export interface ConfiguracionSupabase {
  url: string;
  clavePublica: string;
  tabla: string;
}

function normalizarImagen(imagen: string): string {
  if (/^https?:\/\//i.test(imagen)) return imagen;
  return assetUrl(imagen.replace(/\.(?:png|jpe?g)$/i, '.webp'));
}

export async function obtenerProductosSupabase(
  configuracion: ConfiguracionSupabase,
): Promise<Producto[]> {
  if (!/^[a-zA-Z_][a-zA-Z\d_]*$/.test(configuracion.tabla)) {
    throw new Error('SUPABASE_PRODUCTS_TABLE no es un nombre de tabla válido.');
  }

  const url = new URL(
    `${configuracion.url.replace(/\/+$/, '')}/rest/v1/${configuracion.tabla}`,
  );
  url.searchParams.set('select', 'id,sku,nombre,marca,categoria,precio,stock,imagen,resumen');
  url.searchParams.set('order', 'nombre.asc');
  url.searchParams.set('limit', '200');

  const respuesta = await fetch(url, {
    headers: { apikey: configuracion.clavePublica },
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  });

  if (!respuesta.ok) {
    throw new Error(`Supabase respondió ${respuesta.status}: ${await respuesta.text()}`);
  }

  const data = (await respuesta.json()) as ProductoSupabase[];
  if (!Array.isArray(data)) {
    throw new Error('Supabase devolvió un formato de productos inesperado.');
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
}
