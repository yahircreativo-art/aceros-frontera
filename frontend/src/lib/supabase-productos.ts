import.meta.env;
import type { Producto } from './types';

export interface ConfiguracionSupabase {
  url: string;
  clavePublica: string;
  tabla: string;
}

export async function obtenerProductosSupabase(
  configuracion: ConfiguracionSupabase,
): Promise<Producto[]> {
  const tabla = configuracion.tabla || 'MASTER_PRODUCTOS';
  if (!/^[a-zA-Z_][a-zA-Z\d_]*$/.test(tabla)) {
    throw new Error(`Nombre de tabla no válido: ${tabla}`);
  }

  const url = new URL(`${configuracion.url.replace(/\/+$/, '')}/rest/v1/${tabla}`);
  url.searchParams.set(
    'select',
    'ID,SKU,Nombre,"Categorías","Imágenes","Descripción corta","Descripción"',
  );
  url.searchParams.set('order', 'ID.asc');
  url.searchParams.set('limit', '500');

  const respuesta = await fetch(url, {
    headers: {
      apikey: configuracion.clavePublica,
      Authorization: `Bearer ${configuracion.clavePublica}`,
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  });

  if (!respuesta.ok) {
    throw new Error(`Supabase respondió ${respuesta.status}: ${await respuesta.text()}`);
  }

  const data = (await respuesta.json()) as Array<{
    ID?: string | number | null;
    SKU?: string | number | null;
    Nombre?: string | null;
    Categorías?: string | null;
    Imágenes?: string | null;
    'Descripción corta'?: string | null;
    'Descripción'?: string | null;
  }>;

  if (!Array.isArray(data)) {
    throw new Error('Supabase devolvió un formato inesperado.');
  }

  return data.map((item) => ({
    ID: item.ID ?? null,
    SKU: item.SKU ?? null,
    Nombre: item.Nombre ?? null,
    Categoria: item.Categorías ?? null,
    Imagen: item.Imágenes ?? null,
    DescripcionCorta: item['Descripción corta'] ?? null,
    Descripcion: item['Descripción'] ?? null,
  }));
}

export async function obtenerCategoriasSupabase(
  configuracion: ConfiguracionSupabase,
): Promise<string[]> {
  const tabla = configuracion.tabla || 'MASTER_PRODUCTOS';
  if (!/^[a-zA-Z_][a-zA-Z\d_]*$/.test(tabla)) {
    throw new Error(`Nombre de tabla no válido: ${tabla}`);
  }

  const baseUrl = `${configuracion.url.replace(/\/+$/, '')}/rest/v1/${tabla}`;

  const trySelect = (select: string) => {
    const url = new URL(baseUrl);
    url.searchParams.set('select', select);
    url.searchParams.set('limit', '500');
    return fetch(url, {
      headers: {
        apikey: configuracion.clavePublica,
        Authorization: `Bearer ${configuracion.clavePublica}`,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
  };

  // PostgREST no acepta DISTINCT dentro de select: se pide una sola columna y se
  // deduplica aquí, así sigue siendo una sola petición GET.
  let respuesta = await trySelect('Categorías');

  if (!respuesta.ok) {
    if (respuesta.status === 400) {
      respuesta = await trySelect('Categoría');
    }

    if (!respuesta.ok) {
      throw new Error(`Supabase respondió ${respuesta.status}: ${await respuesta.text()}`);
    }
  }

  const data = (await respuesta.json()) as Array<{
    Categorías?: string | null;
    Categoría?: string | null;
  }>;

  if (!Array.isArray(data)) {
    throw new Error('Supabase devolvió un formato inesperado.');
  }

  const categorias = data
    .map((item) => item['Categorías'] ?? item['Categoría'] ?? '')
    .filter((categoria) => Boolean(categoria))
    .map((categoria) => String(categoria).trim())
    .filter((categoria, index, self) => self.indexOf(categoria) === index);

  return categorias.sort((a, b) => a.localeCompare(b, 'es'));
}
