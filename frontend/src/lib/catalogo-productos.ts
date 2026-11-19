/**
 * Convierte los productos de Supabase al formato del catálogo con filtros.
 * Supabase solo trae nombre, SKU, categoría e imagen, así que las propiedades
 * filtrables se leen del propio nombre (tipo, marca, presentación y medida).
 * Solo se etiqueta lo que el nombre dice: si no hay coincidencia, no se agrega.
 */
import type { Producto } from './types';
import type { ArticuloCatalogo } from './catalogo';
import { nombreLegible } from './seo';
import { rutaProducto } from './rutas-producto';
import { rutaInterna } from './asset-url';

/* Abreviaturas y palabras sin acento de los nombres en Supabase. */
const TIPOS: Record<string, string> = {
  ESM: 'Esmalte', PRIM: 'Primer', SOL: 'Soldadura', SOLD: 'Soldadura', CART: 'Cartucho',
  LENTES: 'Lente', IMPERTE: 'Impermeabilizante', IMPERTERMO: 'Impermeabilizante', THINER: 'Thinner',
  TAPON: 'Tapón', CHAPETON: 'Chapetón', VINILICA: 'Vinílica', TRAFICO: 'Tráfico',
};

/* Marcas que aparecen escritas en el nombre o en la categoría. */
const MARCAS: [RegExp, string][] = [
  [/\bBYP\b/, 'BYP'], [/TRUPER/, 'Truper'], [/AUSTROMEX/, 'Austromex'], [/LINCOLN/, 'Lincoln Electric'],
  [/\bINFRA\b/, 'Infra'], [/FANDELI/, 'Fandeli'], [/PRESTO/, 'Presto'], [/PRETUL/, 'Pretul'],
];

const PRESENTACIONES: [RegExp, string][] = [
  [/CUBETA|19\s?LTS?\b/, 'Cubeta 19 L'],
  [/GAL[OÓ]N/, 'Galón'],
  [/LITRO|\b1\s?LTS?\b/, 'Litro'],
];

const capital = (t: string) => t.charAt(0).toLocaleUpperCase('es-MX') + t.slice(1).toLocaleLowerCase('es-MX');

function propiedades(nombre: string, categoria: string): Record<string, string> {
  const texto = `${nombre} ${categoria}`.toLocaleUpperCase('es-MX');
  const props: Record<string, string> = {};

  const marca = MARCAS.find(([re]) => re.test(texto))?.[1];
  const primera = nombre.trim().split(/[\s./]+/)[0]?.toLocaleUpperCase('es-MX').replace(/[^A-ZÁÉÍÓÚÑ]/g, '') ?? '';
  const esMarca = MARCAS.some(([re]) => re.test(primera));
  if (primera && !esMarca && (TIPOS[primera] || primera.length > 3)) props['Tipo de producto'] = TIPOS[primera] ?? capital(primera);
  if (marca) props.Marca = marca;

  const presentacion = PRESENTACIONES.find(([re]) => re.test(texto))?.[1];
  if (presentacion) props['Presentación'] = presentacion;

  const medida = nombre.match(/\b(\d+\s)?\d+\/\d+\b/)?.[0];
  if (medida) props.Medida = `${medida.trim()}″`;

  return props;
}

export function articulosDeProductos(productos: Producto[]): ArticuloCatalogo[] {
  return productos
    .filter((p) => String(p.Nombre ?? '').trim())
    .map((p) => {
      const nombre = String(p.Nombre).trim();
      const categoria = String(p.Categoria ?? '').trim() || 'Otros';
      const sku = p.SKU != null && String(p.SKU).trim() ? String(p.SKU).trim() : '';
      return {
        id: `s-${sku || p.ID || nombre}`,
        tipo: categoria,
        nombre: nombreLegible(nombre),
        medida: sku ? `SKU ${sku}` : categoria,
        props: propiedades(nombre, categoria),
        ...(p.Imagen ? { imagen: p.Imagen } : {}),
        href: rutaInterna(`${rutaProducto(p)}/`),
      };
    });
}
