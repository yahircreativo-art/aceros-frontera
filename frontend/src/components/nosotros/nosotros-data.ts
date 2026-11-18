/**
 * Datos compartidos por las 5 propuestas de "Nosotros" (NosotrosA…E).
 * Todo sale de datos reales: sucursales, familias, marcas aliadas y servicios.
 * "25+ años" y "3000+ productos" son las cifras que la empresa publica en
 * acerosfrontera.com (revisado el 18 nov 2026).
 */
import { assetUrl, rutaInterna } from '../../lib/asset-url';
import { sucursales } from '../../data/sucursales';
import { familias } from '../../data/familias';
import { obtenerEmpresasAliadas } from '../../lib/empresas';
import { whatsappUrl } from '../../lib/seo';
import { servicios } from '../navbars/nav-data';

export { sucursales, servicios };

const marcas = obtenerEmpresasAliadas();
export const logosMarcas = marcas;
export const ciudades = [...new Set(sucursales.map((s) => s.ciudad))];

export const fotos = {
  bodega: assetUrl('/images/dsc06636.webp'),
  armex: assetUrl('/images/dsc06679.webp'),
  pintura: assetUrl('/images/dsc06771.webp'),
  castillos: assetUrl('/images/dsc06588.webp'),
  placa: assetUrl('/images/dsc06752.webp'),
  herramienta: assetUrl('/images/dsc06784.webp'),
  sucursal: assetUrl('/images/hero-bg.webp'),
  personaje: assetUrl('/images/personaje.webp'),
};

export const cifras = [
  { n: 25, sufijo: '+', texto: 'Años de experiencia', foto: fotos.sucursal },
  { n: sucursales.length, sufijo: '', texto: 'Sucursales en Baja California', foto: fotos.bodega },
  { n: 3000, sufijo: '+', texto: 'Productos en existencia', foto: fotos.armex },
  { n: marcas.length, sufijo: '', texto: 'Marcas que manejamos', foto: fotos.herramienta },
];

export const puntos = [
  `${sucursales.length} sucursales en ${ciudades.join(', ')}.`,
  'El inventario más extenso de la región: acero, ferretería y herramienta.',
  'Fabricación propia de armex, castillos y lámina a la medida.',
  'Servicio a domicilio y centro de servicio autorizado Makita, Bosch y Lincoln Electric.',
];

export const textos = {
  eyebrow: 'Sobre nosotros',
  titulo: 'Su proyecto comienza con nosotros',
  parrafo:
    'Desde herrería artística hasta los cimientos de un nuevo edificio, en Aceros Frontera encontrará los productos que necesita. Somos la mejor opción en servicio, precio y calidad para la industria metalmecánica y de la construcción.',
};

export const enlaces = {
  cotizar: whatsappUrl(),
  sucursales: rutaInterna('/sucursales'),
  nosotros: rutaInterna('/nosotros'),
  catalogo: rutaInterna('/catalogo'),
};
