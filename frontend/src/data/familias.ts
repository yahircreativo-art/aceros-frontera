/**
 * Familias de producto del Design System (Figma: Mega Menu y Section/Categorías).
 * Las usan el mega menú del header y los mosaicos de la portada.
 */
import { normalizar } from '../lib/format';
import { rutaCategoria, slugCategoria } from '../lib/categorias';

export type FamiliaPictograma =
  | 'lamina' | 'varilla' | 'angulo' | 'placa' | 'viga' | 'tubos' | 'tornillo';

export interface Familia {
  /** Título completo (mega menú). */
  titulo: string;
  /** Título corto (etiqueta de los mosaicos de la portada). */
  corto: string;
  icono: FamiliaPictograma;
  items: string[];
  /** Palabras para encontrar la categoría equivalente en el catálogo en línea. */
  buscar: string[];
}

export const familias: Familia[] = [
  { titulo: 'Láminas', corto: 'Láminas', icono: 'lamina', items: ['Metal desplegado', 'Perforada', 'Tablero', 'Traslúcida'], buscar: ['lamina'] },
  { titulo: 'Construcción', corto: 'Construcción', icono: 'varilla', items: ['Varilla', 'Recocido', 'Alambrón', 'Malla electrosoldada'], buscar: ['construccion', 'varilla'] },
  { titulo: 'Perfiles comerciales', corto: 'Perfiles', icono: 'angulo', items: ['Ángulo', 'Perfiles', 'Soleras', 'Tubulares', 'Cuadrado', 'Redondo'], buscar: ['perfil'] },
  { titulo: 'Planos', corto: 'Planos', icono: 'placa', items: ['Lámina galvanizada', 'Lámina negra', 'Antiderrapante', 'Pintada'], buscar: ['plano', 'placa'] },
  { titulo: 'Estructurales', corto: 'Estructurales', icono: 'viga', items: ['Vigas', 'Canal', 'Polín', 'PTR / HSS'], buscar: ['estructural', 'viga'] },
  { titulo: 'Tubería', corto: 'Tubería', icono: 'tubos', items: ['Mofle', 'Para cerco', 'Negro'], buscar: ['tuberia', 'tubo'] },
  { titulo: 'Ferretería', corto: 'Ferretería', icono: 'tornillo', items: ['Pintura y accesorios', 'Tornillería', 'Figuras y herrajes', 'Cerraduras', 'Soldadura'], buscar: ['ferreteria'] },
];

/** Identificador de la página fija de la familia: "Perfiles comerciales" → "perfiles-comerciales". */
export function slugFamilia(familia: Familia): string {
  return slugCategoria(familia.titulo);
}

/** Categoría del catálogo en línea (Supabase) que corresponde a la familia, si existe. */
export function categoriaDeFamilia(familia: Familia, categoriasSitio: readonly string[]): string | undefined {
  return categoriasSitio.find((categoria) =>
    familia.buscar.some((nombre) => normalizar(categoria).includes(normalizar(nombre))),
  );
}

/**
 * Ruta (sin base) de la familia: su categoría del catálogo en línea si existe;
 * si no, su página fija /acero/<familia>/ (src/pages/acero/[familia].astro).
 */
export function rutaFamilia(familia: Familia, categoriasSitio: readonly string[]): string {
  const encontrada = categoriaDeFamilia(familia, categoriasSitio);
  return encontrada ? rutaCategoria(encontrada, categoriasSitio) : `/acero/${slugFamilia(familia)}/`;
}
