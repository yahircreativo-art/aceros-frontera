/**
 * Datos y utilidades compartidas por las 5 propuestas de contacto
 * (ContactoA…E). Todas envían por WhatsApp, igual que el formulario actual
 * (src/components/contacto/Cotizacion.astro): no hay servidor de correo.
 */
import { siteSeo, whatsappUrl } from '../../lib/seo';
import { sucursales, telHref, rutaUrl, mapaEmbed } from '../../data/sucursales';
import { familias } from '../../data/familias';
import { assetUrl } from '../../lib/asset-url';

export { siteSeo, whatsappUrl, sucursales, telHref, rutaUrl, mapaEmbed, familias };

export const icono = (nombre: string) => `${assetUrl('/icons.svg')}#${nombre}`;
export const ciudades = [...new Set(sucursales.map((s) => s.ciudad))];
export const waBase = `https://wa.me/${siteSeo.whatsapp}?text=`;

/** Datos de sucursal que necesita el navegador (horario, ubicación). */
export const sucursalesCliente = sucursales.map((s) => ({
  id: s.id,
  nombre: s.nombre.replace('Sucursal ', ''),
  ciudad: s.ciudad,
  direccion: `${s.direccion}, ${s.colonia}`,
  telefono: s.telefonos[0],
  tel: telHref(s.telefonos[0]),
  horarios: s.horarios,
  lat: s.coordenadas.lat,
  lng: s.coordenadas.lng,
  ruta: rutaUrl(s),
  mapa: mapaEmbed(s),
}));
export type SucursalCliente = (typeof sucursalesCliente)[number];
