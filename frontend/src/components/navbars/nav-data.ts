/**
 * Datos compartidos por las 5 propuestas de navbar (NavbarA…NavbarE).
 * Todas reciben `productos` igual que Header.astro, así que basta con
 * cambiar el import en la página para previsualizar cada una.
 */
import { assetUrl, rutaInterna } from '../../lib/asset-url';
import { familias, rutaFamilia, type Familia } from '../../data/familias';
import { sucursales } from '../../data/sucursales';
import type { Producto } from '../../lib/types';

export { familias, sucursales };
export type { Familia };

export const enlaces = [
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/#servicios', label: 'Servicios' },
  { href: '/sucursales', label: 'Sucursales' },
  { href: '/contacto', label: 'Contacto' },
].map((e) => ({ ...e, href: rutaInterna(e.href) }));

/** Servicios (mismos id/anclas que components/home/Servicios.astro). */
export const servicios = [
  { id: 'venta-y-distribucion', titulo: 'Venta y distribución', desc: 'Acero a todo Baja California desde 6 sucursales.', imagen: '/images/dsc06636.webp' },
  { id: 'productos-a-la-medida', titulo: 'Productos a la medida', desc: 'Armex, anillos, lámina R-72 y steel deck.', imagen: '/images/dsc06679.webp' },
  { id: 'corte-de-placa', titulo: 'Corte de placa', desc: 'Cortamos placa a tu especificación.', imagen: '/images/dsc06752.webp' },
  { id: 'venta-de-pintura', titulo: 'Venta de pintura', desc: 'Marcas líderes para obra, herrería e industria.', imagen: '/images/dsc06771.webp' },
  { id: 'fabricacion-de-armex', titulo: 'Armex y castillos', desc: 'Fabricación propia lista para obra.', imagen: '/images/dsc06588.webp' },
  { id: 'venta-y-servicio-de-herramienta', titulo: 'Servicio de herramienta', desc: 'Venta, garantía y reparación.', imagen: '/images/dsc06784.webp' },
].map((s) => ({ ...s, href: rutaInterna(`/#${s.id}`), imagen: assetUrl(s.imagen) }));

/** Foto representativa por familia (para los paneles con imagen). */
const FOTOS_FAMILIA = ['/images/dsc06679.webp', '/images/dsc06588.webp', '/images/dsc06636.webp', '/images/dsc06752.webp', '/images/hero-bg.webp', '/images/dsc06771.webp', '/images/dsc06784.webp'];

export function prepararNav(productos: Producto[]) {
  const categorias = [...new Set(productos.map((p) => p.Categoria).filter(Boolean))]
    .map((c) => String(c).trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'es'));

  const familiasNav = familias.map((familia, i) => ({
    ...familia,
    href: rutaInterna(rutaFamilia(familia, categorias)),
    foto: assetUrl(FOTOS_FAMILIA[i % FOTOS_FAMILIA.length]),
  }));

  return { categorias, familiasNav, catalogo: rutaInterna('/catalogo') };
}
