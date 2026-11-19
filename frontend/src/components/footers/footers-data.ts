/**
 * Datos compartidos por las propuestas de Footer A–E. Todo sale de
 * src/data/seo.json y src/data/sucursales.ts (datos reales del negocio).
 */
import { siteSeo, whatsappUrl } from '../../lib/seo';
import { sucursales, sucursalesPorCiudad, telHref, rutaUrl } from '../../data/sucursales';

export { siteSeo, whatsappUrl, sucursales, sucursalesPorCiudad, telHref, rutaUrl };

export const anio = new Date().getFullYear();

/** Lema de marca (el mismo del footer publicado). */
export const lema = '¿Precios? ¡Nos arreglamos!';

export interface EnlacePie {
  href: string;
  label: string;
  externo?: boolean;
}

/** Mismos enlaces del footer publicado. Rutas sin base: pásalas por rutaInterna(). */
export const columnas: { titulo: string; enlaces: EnlacePie[] }[] = [
  {
    titulo: 'Catálogo',
    enlaces: [
      { href: '/catalogo', label: 'Todos los productos' },
      { href: '/#marcas', label: 'Marcas que manejamos' },
      { href: whatsappUrl(), label: 'Cotizar materiales', externo: true },
    ],
  },
  {
    titulo: 'Empresa',
    enlaces: [
      { href: '/nosotros', label: 'Nosotros' },
      { href: '/#servicios', label: 'Servicios' },
      { href: '/sucursales', label: 'Sucursales' },
      { href: '/contacto', label: 'Contacto' },
    ],
  },
];

export const navegacion = columnas.flatMap((c) => c.enlaces).filter((e) => !e.externo);

/** "Lunes a viernes 07:30 – 17:30" → horas sin cero inicial. */
const hora = (h: string) => h.replace(/^0/, '');
export const horarios = siteSeo.openingHours.map((h) => ({ dias: h.label, horas: `${hora(h.opens)} – ${hora(h.closes)}` }));

export const redes = siteSeo.socials;

export const direccion = `${siteSeo.address.street}, C.P. ${siteSeo.address.postalCode}, ${siteSeo.address.city}, ${siteSeo.address.region}`;

/** "Sucursal Cucapah" → "Cucapah" */
export const nombreCorto = (nombre: string) => nombre.replace(/^Sucursal\s+/, '');
