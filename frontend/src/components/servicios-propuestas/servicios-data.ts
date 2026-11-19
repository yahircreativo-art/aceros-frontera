/**
 * Servicios de Aceros Frontera: una sola fuente para la sección publicada
 * (home/Servicios.astro) y las propuestas Servicios A–E.
 * Los `id` son anclas públicas (/#corte-de-placa…): no los cambies sin revisar los enlaces.
 */
import { assetUrl } from '../../lib/asset-url';
import { whatsappUrl } from '../../lib/seo';
import type { PictogramName } from '../ui/Pictogram.astro';

export interface Servicio {
  id: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  /** Pictograma de marca para las propuestas de línea. */
  pictograma: PictogramName;
}

export const servicios: Servicio[] = [
  {
    id: 'venta-y-distribucion',
    titulo: 'Venta y distribución de acero',
    descripcion:
      'Con 6 sucursales y centros de distribución en Tijuana, Mexicali y Ensenada, proveemos acero a todo Baja California.',
    imagen: assetUrl('/images/dsc06636.webp'),
    pictograma: 'viga',
  },
  {
    id: 'productos-a-la-medida',
    titulo: 'Productos a la medida',
    descripcion:
      'Fabricamos ARMEX, anillos para castillos, lámina R-72 y steel deck, y ofrecemos corte de placa a tu especificación.',
    imagen: assetUrl('/images/dsc06679.webp'),
    pictograma: 'lamina',
  },
  {
    id: 'venta-de-pintura',
    titulo: 'Venta de pintura',
    descripcion: 'Las mejores marcas de pintura en distintas presentaciones para obra, herrería e industria.',
    imagen: assetUrl('/images/dsc06771.webp'),
    pictograma: 'bote',
  },
  {
    id: 'fabricacion-de-armex',
    titulo: 'Armex, castillos y anillos',
    descripcion: 'Somos fabricantes de ARMEX y anillos para castillos, en medidas estándar y especiales.',
    imagen: assetUrl('/images/dsc06588.webp'),
    pictograma: 'varilla',
  },
  {
    id: 'corte-de-placa',
    titulo: 'Corte de placa',
    descripcion: 'Corte de placa de acero A36 en 3/16″, 1/4″, 5/16″, 3/8″, 1/2″, 5/8″, 3/4″ y 1″.',
    imagen: assetUrl('/images/dsc06752.webp'),
    pictograma: 'placa',
  },
  {
    id: 'venta-y-servicio-de-herramienta',
    titulo: 'Venta y servicio de herramienta',
    descripcion:
      'Venta y reparación de maquinaria. Centro de servicio autorizado de Makita, Bosch y Lincoln Electric.',
    imagen: assetUrl('/images/dsc06784.webp'),
    pictograma: 'taladro',
  },
];

/** Enlace "Solicitar información" de cada servicio. */
export const infoUrl = (s: Servicio) => whatsappUrl(`Hola, quiero información sobre el servicio de ${s.titulo}.`);

/** Dato real para la cota. */
export const cotaServicios = `${servicios.length} servicios para tu obra o taller`;
