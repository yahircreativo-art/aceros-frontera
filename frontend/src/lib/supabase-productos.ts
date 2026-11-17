import { assetUrl } from './asset-url';
import type { Producto } from './types';

interface ProductoSupabase {
  Clave?: string | number | null;
  Nombre?: string | null;
  'LINK EDITADO (PNG)'?: string | null;
  CATEGORIA?: string | null;
  // Compatibilidad con posibles nombres alternativos en minúsculas
  clave?: string | number | null;
  nombre?: string | null;
  categoria?: string | null;
  imagen?: string | null;
}

export interface ConfiguracionSupabase {
  url: string;
  clavePublica: string;
  tabla: string;
}

function normalizarImagen(imagen?: string | null): string {
  if (!imagen || typeof imagen !== 'string' || imagen.trim() === '') {
    return assetUrl('/images/productos/default-product.svg');
  }

  const limpia = imagen.trim();

  if (/^https?:\/\//i.test(limpia)) {
    // Si es un archivo de Google Drive (ej: /file/d/ID/...)
    const matchArchivo = limpia.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (matchArchivo) {
      return `https://drive.google.com/thumbnail?id=${matchArchivo[1]}&sz=w800`;
    }

    // Si tiene parámetro ?id=ID
    const matchId = limpia.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchId && !limpia.includes('/folders/')) {
      return `https://drive.google.com/thumbnail?id=${matchId[1]}&sz=w800`;
    }

    // Si es un enlace de carpeta de Drive, no puede mostrarse directamente como <img>
    if (limpia.includes('/folders/')) {
      return assetUrl('/images/productos/default-product.svg');
    }

    return limpia;
  }

  return assetUrl(limpia.replace(/\.(?:png|jpe?g)$/i, '.webp'));
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
  // Campos solicitados: Clave, Nombre, LINK EDITADO (PNG), CATEGORIA
  url.searchParams.set('select', 'Clave,Nombre,"LINK EDITADO (PNG)",CATEGORIA');
  url.searchParams.set('order', 'Nombre.asc');
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

  const data = (await respuesta.json()) as ProductoSupabase[];
  if (!Array.isArray(data)) {
    throw new Error('Supabase devolvió un formato de productos inesperado.');
  }

  return data
    .filter((item) => Boolean(item.Nombre || item.nombre))
    .map((item, index) => {
      const claveStr = String(item.Clave ?? item.clave ?? `PROD-${index + 1}`).trim();
      const nombreStr = String(item.Nombre ?? item.nombre ?? '').trim();
      const categoriaStr = String(item.CATEGORIA ?? item.categoria ?? 'General').trim();
      const linkEditado = item['LINK EDITADO (PNG)'] ?? item.imagen ?? null;

      const slugBase = claveStr || nombreStr;
      const slug = slugBase
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '') || `producto-${index + 1}`;

      return {
        slug,
        clave: claveStr,
        sku: claveStr,
        nombre: nombreStr,
        categoria: categoriaStr,
        imagen: normalizarImagen(linkEditado),
        linkEditado: linkEditado ?? undefined,
        etiquetas: [],
        rating: 5,
        reviews: 0,
        destacado: false,
        envioGratis: false,
      };
    });
}
