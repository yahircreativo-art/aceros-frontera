import type { Producto } from './types';

export interface ConfiguracionSupabase {
  url: string;
  clavePublica: string;
  tabla: string;
}

/* PostgREST devuelve como máximo 1000 filas por petición: se pide por bloques hasta vaciar la tabla. */
const BLOQUE = 1000;
const MAX_BLOQUES = 50;

type FilaSupabase = {
  ID?: string | number | null;
  SKU?: string | number | null;
  Nombre?: string | null;
  Categorías?: string | null;
  Imágenes?: string | null;
  'Descripción corta'?: string | null;
  'Descripción'?: string | null;
};

export async function obtenerProductosSupabase(
  configuracion: ConfiguracionSupabase,
): Promise<Producto[]> {
  const tabla = configuracion.tabla || 'MASTER_PRODUCTOS';
  if (!/^[a-zA-Z_][a-zA-Z\d_]*$/.test(tabla)) {
    throw new Error(`Nombre de tabla no válido: ${tabla}`);
  }

  const filas: FilaSupabase[] = [];
  for (let i = 0; i < MAX_BLOQUES; i++) {
    const url = new URL(`${configuracion.url.replace(/\/+$/, '')}/rest/v1/${tabla}`);
    url.searchParams.set(
      'select',
      'ID,SKU,Nombre,"Categorías","Imágenes","Descripción corta","Descripción"',
    );
    url.searchParams.set('order', 'ID.asc');
    url.searchParams.set('limit', String(BLOQUE));
    url.searchParams.set('offset', String(i * BLOQUE));

    const respuesta = await fetch(url, {
      headers: {
        apikey: configuracion.clavePublica,
        Authorization: `Bearer ${configuracion.clavePublica}`,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });

    if (!respuesta.ok) {
      throw new Error(`Supabase respondió ${respuesta.status}: ${await respuesta.text()}`);
    }

    const bloque = (await respuesta.json()) as FilaSupabase[];
    if (!Array.isArray(bloque)) {
      throw new Error('Supabase devolvió un formato inesperado.');
    }

    filas.push(...bloque);
    if (bloque.length < BLOQUE) break;
  }

  return filas.map((item) => ({
    ID: item.ID ?? null,
    SKU: item.SKU ?? null,
    Nombre: item.Nombre ?? null,
    Categoria: item.Categorías ?? null,
    Imagen: item.Imágenes ?? null,
    DescripcionCorta: item['Descripción corta'] ?? null,
    Descripcion: item['Descripción'] ?? null,
  }));
}
