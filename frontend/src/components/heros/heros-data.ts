/**
 * Datos compartidos por las propuestas de Hero H–L. Solo reexporta o deriva
 * datos reales (sucursales, familias, medidas publicadas en acerosfrontera.com).
 */
import { sucursales } from '../../data/sucursales';
import type { FormaDibujo } from '../../data/medidas-acero';
import type { PictogramName } from '../ui/Pictogram.astro';

export const ciudades = [...new Set(sucursales.map((s) => s.ciudad))];

/** "Tijuana, Mexicali y Ensenada" */
export const ciudadesTexto = `${ciudades.slice(0, -1).join(', ')} y ${ciudades.at(-1)}`;

/** Servicios que publica la empresa en su sitio (pictograma de marca o icono de /icons.svg). */
export const servicios: { titulo: string; texto: string; pictograma?: PictogramName; icono?: string }[] = [
  { titulo: 'Corte de placa', texto: 'Placa A36 de 3/16″ a 1″, cortada a la medida que necesitas.', pictograma: 'placa' },
  { titulo: 'Fabricación de armex', texto: 'Armex para castillos y cadenas, listo para colar.', pictograma: 'varilla' },
  { titulo: 'Igualado de pintura', texto: 'Igualamos el color que traigas para tus acabados.', pictograma: 'bote' },
  { titulo: 'Servicio a domicilio', texto: 'Llevamos el material hasta tu obra o tu taller.', icono: 'truck' },
  { titulo: 'Centro de servicio autorizado', texto: 'Reparación y garantía de herramienta Makita, Bosch y Lincoln Electric.', pictograma: 'taladro' },
];

/**
 * Sección transversal 2D de una pieza (vista de frente, en mm) para dibujarla
 * como plano. Devuelve el trazo y su caja; sirve en el servidor y en el navegador.
 */
export function seccion2d(d: FormaDibujo): { path: string; ancho: number; alto: number } {
  const n = (x: number) => +x.toFixed(2);
  switch (d.forma) {
    case 'angulo': {
      const { a, e } = d;
      return { path: `M0 0H${n(e)}V${n(a - e)}H${n(a)}V${n(a)}H0Z`, ancho: a, alto: a };
    }
    case 'cuadrado':
      return { path: `M0 0H${n(d.a)}V${n(d.a)}H0Z`, ancho: d.a, alto: d.a };
    case 'polin': {
      /* Canal C con pestañas (monten). */
      const { d: h, b, e } = d;
      const p = Math.min(b * 0.35, h * 0.2);
      return {
        path: `M${n(b)} ${n(p)}V0H0V${n(h)}H${n(b)}V${n(h - p)}H${n(b - e)}V${n(h - e)}H${n(e)}V${n(e)}H${n(b - e)}V${n(p)}Z`,
        ancho: b,
        alto: h,
      };
    }
    case 'viga': {
      const { d: h, b, tf, tw } = d;
      const x1 = (b - tw) / 2;
      const x2 = (b + tw) / 2;
      return {
        path: `M0 0H${n(b)}V${n(tf)}H${n(x2)}V${n(h - tf)}H${n(b)}V${n(h)}H0V${n(h - tf)}H${n(x1)}V${n(tf)}H0Z`,
        ancho: b,
        alto: h,
      };
    }
  }
}

/** "6 sucursales en Tijuana, Mexicali y Ensenada" */
export const coberturaTexto = `${sucursales.length} sucursales en ${ciudadesTexto}`;
