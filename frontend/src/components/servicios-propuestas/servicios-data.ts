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
    id: 'fabricacion-de-lamina',
    titulo: 'Fabricación de lámina',
    descripcion:
      'Rolamos lámina acanalada R-72 y steel deck para techos, muros y entrepisos, cortada al largo exacto que necesitas.',
    imagen: assetUrl('/images/dsc06679.webp'),
    pictograma: 'lamina',
  },
  {
    id: 'fabricacion-de-armex',
    titulo: 'Armex',
    descripcion:
      'Armados de varilla para castillos, cadenas y trabes, en medidas estándar y a la medida de tu proyecto, listos para colocar.',
    imagen: assetUrl('/images/dsc06636.webp'),
    pictograma: 'varilla',
  },
  {
    id: 'estribos',
    titulo: 'Estribos',
    descripcion:
      'Estribos y anillos doblados en serie con medidas uniformes, listos para armar castillos y columnas y adelantar tu colado.',
    imagen: assetUrl('/images/dsc06588.webp'),
    pictograma: 'malla',
  },
  {
    id: 'corte-de-placa',
    titulo: 'Corte de placa',
    descripcion: 'Corte de placa de acero A36 en 3/16″, 1/4″, 5/16″, 3/8″, 1/2″, 5/8″, 3/4″ y 1″.',
    imagen: assetUrl('/images/dsc06752.webp'),
    pictograma: 'placa',
  },
  {
    id: 'venta-y-distribucion',
    titulo: 'Distribución de acero',
    descripcion:
      'Con 6 sucursales y centros de distribución en Tijuana, Mexicali y Ensenada, proveemos acero a todo Baja California.',
    imagen: assetUrl('/images/hero-bg.webp'),
    pictograma: 'viga',
  },
  {
    id: 'venta-y-servicio-de-herramienta',
    titulo: 'Centro de servicio autorizado',
    descripcion: 'Venta y reparación de herramienta y maquinaria. Centro de servicio autorizado de Makita, Bosch y Lincoln Electric.',
    imagen: assetUrl('/images/dsc06784.webp'),
    pictograma: 'taladro',
  },
];

/** Enlace "Solicitar información" de cada servicio. */
export const infoUrl = (s: Servicio) => whatsappUrl(`Hola, quiero información sobre el servicio de ${s.titulo}.`);

/** Dato real para la cota. */
export const cotaServicios = `${servicios.length} servicios para tu obra o taller`;

/** Encabezado de la sección "Infraestructura que respalda" (home/Servicios.astro y propuestas F–J). */
export const encabezado = {
  titulo: 'Infraestructura que respalda',
  descripcion: 'Cobertura, versatilidad en transformación y soporte técnico para optimizar tus tiempos y reducir mermas.',
};
