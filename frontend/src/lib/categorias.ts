import type { PictogramName } from '../components/ui/Pictogram.astro';
export function slugCategoria(categoria: string): string {
  return (
    categoria
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'categoria'
  );
}

export function rutasCategorias(categorias: readonly string[]): Map<string, string> {
  const unicas = [...new Set(categorias.map((categoria) => categoria.trim()).filter(Boolean))];
  const grupos = new Map<string, string[]>();

  for (const categoria of unicas) {
    const slug = slugCategoria(categoria);
    grupos.set(slug, [...(grupos.get(slug) ?? []), categoria]);
  }

  const rutas = new Map<string, string>();
  for (const [slug, grupo] of grupos) {
    const ordenadas = grupo.sort((a, b) => a.localeCompare(b, 'es'));
    ordenadas.forEach((categoria, indice) => {
      const sufijo = ordenadas.length > 1 ? `-${indice + 1}` : '';
      rutas.set(categoria, `/catalogo/${slug}${sufijo}`);
    });
  }

  return rutas;
}

export function rutaCategoria(categoria: string, categorias: readonly string[]): string {
  const normalizada = categoria.trim();
  return (
    rutasCategorias(categorias).get(normalizada) ??
    `/catalogo/${slugCategoria(normalizada)}`
  );
}

/** Pictograma de una categoría del catálogo en línea (por palabras de su nombre). */
const ICONOS_CATEGORIA: { palabras: string[]; icono: PictogramName }[] = [
  { palabras: ['aerosol'], icono: 'aerosol' },
  { palabras: ['solvente', 'thinner', 'adelgazador'], icono: 'bidon' },
  { palabras: ['pintura'], icono: 'bote' },
  { palabras: ['puerta', 'ventana'], icono: 'puerta' },
  { palabras: ['soldadura'], icono: 'soldadura' },
  { palabras: ['disco', 'austromex'], icono: 'disco' },
  { palabras: ['figura', 'artistic'], icono: 'voluta' },
  { palabras: ['fandeli', 'lija', 'abrasiv'], icono: 'lija' },
  { palabras: ['presto', 'cartucho', 'sellador'], icono: 'cartucho' },
  { palabras: ['ferreter', 'tornill'], icono: 'tornillo' },
  { palabras: ['truper', 'herramienta'], icono: 'herramienta' },
];

export function iconoCategoria(categoria: string): PictogramName {
  const clave = slugCategoria(categoria);
  return ICONOS_CATEGORIA.find(({ palabras }) => palabras.some((p) => clave.includes(p)))?.icono ?? 'herramienta';
}
