/**
 * Datos de las sucursales de Aceros Frontera en Baja California.
 * Fuente: acerosfrontera.com/telefonos-y-direcciones (teléfonos, horarios y direcciones).
 */

export interface HorarioSucursal {
  dias: string;
  horas: string;
}

export interface Sucursal {
  id: string;
  nombre: string;
  ciudad: string;
  estado: string;
  direccion: string;
  colonia: string;
  codigoPostal?: string;
  telefonos: string[];
  horarios: HorarioSucursal[];
  coordenadas: { lat: number; lng: number };
  /** Ficha de Google Maps de la sucursal. */
  mapaUrl: string;
}

const HORARIO_SEMANA: HorarioSucursal = { dias: 'Lunes a viernes', horas: '7:30 – 17:30' };
const HORARIO_SABADO: HorarioSucursal = { dias: 'Sábado', horas: '7:30 – 14:00' };

export const sucursales: Sucursal[] = [
  {
    id: 'cucapah',
    nombre: 'Sucursal Cucapah',
    ciudad: 'Tijuana',
    estado: 'Baja California',
    direccion: 'Blvd. Cucapah 20498',
    colonia: 'Col. Buenos Aires Sur',
    codigoPostal: '22207',
    telefonos: ['664 629 5073', '664 661 0567', '664 661 0570'],
    horarios: [HORARIO_SEMANA, HORARIO_SABADO, { dias: 'Domingo', horas: '8:00 – 13:00' }],
    coordenadas: { lat: 32.511797, lng: -116.897485 },
    mapaUrl:
      'https://www.google.com/maps/place/STEEL+AND+PROFILES+FRONTERA/@32.387956,-116.9854608,10.77z?shorturl=1',
  },
  {
    id: 'matamoros',
    nombre: 'Sucursal Matamoros',
    ciudad: 'Tijuana',
    estado: 'Baja California',
    direccion: 'Hermenegildo Galeana 1418',
    colonia: 'Col. Ejido Matamoros',
    telefonos: ['664 720 9227', '664 720 9223', '664 720 9224', '664 720 9222'],
    horarios: [HORARIO_SEMANA, HORARIO_SABADO],
    coordenadas: { lat: 32.4850767, lng: -116.8736109 },
    mapaUrl:
      'https://www.google.com/maps/place/Aceros+Frontera/@32.4848889,-116.8735556,18z?entry=ttu',
  },
  {
    id: 'panamericano',
    nombre: 'Sucursal Panamericano',
    ciudad: 'Tijuana',
    estado: 'Baja California',
    direccion: 'Libramiento Oriente 7800-A',
    colonia: 'Col. Panamericano',
    telefonos: ['664 700 5123', '664 379 3341', '664 636 6757', '664 637 2701', '664 637 2775'],
    horarios: [HORARIO_SEMANA, HORARIO_SABADO],
    coordenadas: { lat: 32.4686237, lng: -117.0160572 },
    mapaUrl:
      'https://www.google.com/maps/place/Aceros+Y+Perfiles+Frontera+Pana/@32.4686237,-117.0160572,15z?shorturl=1',
  },
  {
    id: 'mexicali',
    nombre: 'Sucursal Mexicali',
    ciudad: 'Mexicali',
    estado: 'Baja California',
    direccion: 'Blvd. Lázaro Cárdenas 1893',
    colonia: 'Fracc. La Bodega',
    telefonos: ['686 555 0067', '686 555 0068'],
    horarios: [HORARIO_SEMANA, HORARIO_SABADO],
    coordenadas: { lat: 32.6252829, lng: -115.409777 },
    mapaUrl:
      'https://www.google.com/maps/place/Comercial+de+Aceros+y+Perfiles+Frontera/@32.6252829,-115.409777,15z?shorturl=1',
  },
  {
    id: 'ensenada-hidalgo',
    nombre: 'Sucursal Ensenada Hidalgo',
    ciudad: 'Ensenada',
    estado: 'Baja California',
    direccion: 'Av. Hidalgo 855',
    colonia: 'Col. Obrera',
    codigoPostal: '22830',
    telefonos: ['646 206 1201', '646 206 1208', '646 153 2069', '646 227 1284'],
    horarios: [HORARIO_SEMANA, HORARIO_SABADO],
    coordenadas: { lat: 31.8666917, lng: -116.6105163 },
    mapaUrl:
      'https://www.google.com/maps/place/Aceros+Frontera/@31.8666917,-116.612705,17z?shorturl=1',
  },
  {
    id: 'ensenada-chapultepec',
    nombre: 'Sucursal Ensenada Chapultepec',
    ciudad: 'Ensenada',
    estado: 'Baja California',
    direccion: 'Carr. Transpeninsular 1125',
    colonia: 'Col. Aeropuerto',
    codigoPostal: '22785',
    telefonos: ['646 596 8991', '646 153 0226', '646 596 8990'],
    horarios: [HORARIO_SEMANA, HORARIO_SABADO],
    coordenadas: { lat: 31.7848111, lng: -116.5913978 },
    mapaUrl:
      'https://www.google.com/maps/place/Aceros+Frontera+Ensenada+Chapultepec/@31.7846047,-116.5923855,16z?entry=ttu',
  },
];

/** Enlace telefónico a partir del número visible (664 629 5073 → tel:+526646295073). */
export function telHref(telefono: string): string {
  return `tel:+52${telefono.replace(/\D/g, '')}`;
}

/** Mapa embebido de Google centrado en la sucursal. */
export function mapaEmbed(sucursal: Sucursal): string {
  const { lat, lng } = sucursal.coordenadas;
  return `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
}

/** Ruta en Google Maps desde la ubicación del visitante. */
export function rutaUrl(sucursal: Sucursal): string {
  const { lat, lng } = sucursal.coordenadas;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/** Agrupa por ciudad conservando el orden del arreglo. */
export function sucursalesPorCiudad(): { ciudad: string; sucursales: Sucursal[] }[] {
  const grupos = new Map<string, Sucursal[]>();

  for (const sucursal of sucursales) {
    const lista = grupos.get(sucursal.ciudad) ?? [];
    lista.push(sucursal);
    grupos.set(sucursal.ciudad, lista);
  }

  return [...grupos].map(([ciudad, lista]) => ({ ciudad, sucursales: lista }));
}
