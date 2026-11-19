/**
 * Forma común de lo que muestra el catálogo con filtros (CatalogoFiltros.tsx):
 * medidas de acero (data/medidas-acero.ts) y productos de Supabase
 * (lib/catalogo-productos.ts). Solo tipos: se importa también en el navegador.
 */
import type { FormaDibujo } from '../data/medidas-acero';

export interface ArticuloCatalogo {
  id: string;
  /** Agrupador principal del filtro (tipo de pieza o categoría). */
  tipo: string;
  nombre: string;
  /** Segunda línea: medida de la pieza o SKU del producto. */
  medida: string;
  /** Etiqueta destacada (p. ej. "ASTM A36"). */
  norma?: string;
  /** Propiedades filtrables: el filtro lateral sale de aquí. */
  props: Record<string, string>;
  /** Orden natural por medida; sin él se ordena por nombre. */
  orden?: number[];
  /** Peso teórico en kg/m (solo acero). */
  kgm?: number;
  /** Datos extra de la tabla: [etiqueta, valor]. */
  pesos?: [string, string][];
  dibujo?: FormaDibujo;
  imagen?: string;
  /** Subpágina del artículo, ya con la base aplicada. */
  href?: string;
}
