/**
 * Datos compartidos por las 5 propuestas de la sección Catálogo
 * (CatalogoA…E). Cada familia lleva su boceto isométrico de línea
 * (mismo motor que la sección "Planos": src/lib/planos.ts).
 */
import { familias, rutaFamilia, type Familia } from '../../data/familias';
import { piezasPlano, crearPlano, type Plano, type Punto } from '../../lib/planos';
import { rutaInterna } from '../../lib/asset-url';
import { rutaCategoria } from '../../lib/categorias';
import { whatsappUrl } from '../../lib/seo';
import type { Producto } from '../../lib/types';

const circulo = (radio: number, cz: number, pasos = 48): Punto[] =>
  Array.from({ length: pasos }, (_, i) => {
    const t = (i / pasos) * Math.PI * 2;
    return [Math.cos(t) * radio, cz + Math.sin(t) * radio];
  });
const hexagono = (radio: number, cz: number): Punto[] =>
  Array.from({ length: 6 }, (_, i) => {
    const t = (i / 6) * Math.PI * 2 + Math.PI / 6;
    return [Math.cos(t) * radio, cz + Math.sin(t) * radio];
  });

const pieza = (nombre: string) => piezasPlano.find((p) => p.nombre === nombre)!;

/** Boceto + especificación corta por familia (clave = icono de la familia). */
const bocetos: Record<Familia['icono'], { plano: Plano; pieza: string; spec: string }> = {
  lamina: { plano: pieza('Lámina R-72').plano, pieza: 'Lámina R-72', spec: pieza('Lámina R-72').spec },
  varilla: {
    plano: crearPlano([{ puntos: circulo(9, 9), liso: true }], 230, '12.00 m', [{ texto: 'Corrugada', punto: [120, 0, 18] }]),
    pieza: 'Varilla corrugada',
    spec: '3/8″ a 1″ · 12 m',
  },
  angulo: { plano: pieza('Ángulo').plano, pieza: 'Ángulo', spec: pieza('Ángulo').spec },
  placa: {
    plano: crearPlano(
      [{ puntos: [[-70, 0], [70, 0], [70, 6], [-70, 6]] }],
      150,
      '3.05 m',
      [{ texto: 'Espesor', punto: [150, 70, 3], lado: 'derecha' }],
    ),
    pieza: 'Placa de acero',
    spec: '3/16″ a 2″ · 1.22 × 3.05 m',
  },
  viga: { plano: pieza('Viga IPR').plano, pieza: 'Viga IPR', spec: pieza('Viga IPR').spec },
  tubos: { plano: pieza('Tubo redondo').plano, pieza: 'Tubo redondo', spec: pieza('Tubo redondo').spec },
  tornillo: {
    plano: crearPlano(
      [{ puntos: hexagono(34, 34) }, { puntos: circulo(17, 34), liso: true, hueco: true }],
      26,
      'Ø 1″',
    ),
    pieza: 'Tuerca hexagonal',
    spec: 'Tornillería y herrajes',
  },
};

export interface FamiliaCatalogo extends Familia {
  numero: string;
  href: string;
  plano: Plano;
  pieza: string;
  spec: string;
}

/** Familias con enlace a su categoría del catálogo en línea y su boceto. */
export function prepararFamilias(productos: Producto[]): FamiliaCatalogo[] {
  const categoriasSitio = [...new Set(productos.map((p) => String(p.Categoria ?? '').trim()).filter(Boolean))];
  return familias.map((f, i) => ({
    ...f,
    numero: String(i + 1).padStart(2, '0'),
    href: rutaInterna(rutaFamilia(f, categoriasSitio)),
    ...bocetos[f.icono],
    spec: bocetos[f.icono].spec.replace(/ · /g, ', '),
  }));
}

/** Categorías reales del catálogo en línea con conteo y muestras con foto. */
export function prepararCategorias(productos: Producto[], muestras = 8) {
  const categoriasSitio = [...new Set(productos.map((p) => String(p.Categoria ?? '').trim()).filter(Boolean))];
  return categoriasSitio
    .map((nombre) => {
      const todos = productos.filter((p) => String(p.Categoria ?? '').trim() === nombre);
      return {
        nombre,
        total: todos.length,
        href: rutaInterna(rutaCategoria(nombre, categoriasSitio)),
        productos: todos
          .filter((p) => p.Imagen && p.Nombre)
          .slice(0, muestras)
          .map((p) => ({ nombre: String(p.Nombre), imagen: String(p.Imagen) })),
      };
    })
    .filter((c) => c.productos.length > 0)
    .sort((a, b) => b.total - a.total);
}

export const catalogoUrl = rutaInterna('/catalogo');
export const cotizarLista = whatsappUrl('Hola, les envío mi lista de materiales para cotizar.');
