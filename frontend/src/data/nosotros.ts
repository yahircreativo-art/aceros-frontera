/**
 * Contenido de la página /nosotros.
 *
 * IMÁGENES: colócalas en public/images/nosotros/ y escribe aquí la ruta,
 * por ejemplo imagen: '/images/nosotros/equipo.webp'. Mientras una imagen
 * esté vacía se muestra el fondo metálico de marca en su lugar.
 *
 * TEXTOS: revisa los marcados con "PENDIENTE"; son textos provisionales
 * escritos a partir de lo que ya dice el sitio y conviene sustituirlos por
 * los de la empresa.
 */

export const historia = {
  titulo: 'Nuestra historia',
  /* Textos de acerosfrontera.com. PENDIENTE: ampliar con la historia de la empresa. */
  parrafos: [
    'Su proyecto comienza con nosotros. Desde herrería artística hasta los cimientos de un nuevo edificio, en Aceros Frontera encontrará los productos que usted necesita.',
    'Con más de 25 años de experiencia, más de 3000 productos en existencia y 6 sucursales en Tijuana, Mexicali y Ensenada, somos la mejor opción en servicio, precio y calidad para la industria metalmecánica y de la construcción.',
  ],
  imagen: '',
  imagenAlt: 'Equipo de Aceros Frontera',
};

export interface TarjetaNosotros {
  etiqueta: string;
  titulo: string;
  texto: string;
  imagen: string;
  /** Destino del enlace "Leer más"; vacío oculta el enlace. */
  href: string;
  enlace: string;
}

export const tarjetas: TarjetaNosotros[] = [
  {
    etiqueta: 'Equipo',
    titulo: 'Nuestro equipo',
    /* PENDIENTE */
    texto: 'Personal de mostrador, almacén y reparto que conoce el acero y la herramienta, listo para asesorarte en cada sucursal.',
    imagen: '',
    href: '/contacto',
    enlace: 'Contactar al equipo',
  },
  {
    etiqueta: 'Empresa',
    titulo: 'Misión y visión',
    /* PENDIENTE: misión y visión oficiales. */
    texto: 'Ser la mejor opción en servicio, precio y calidad para la industria metalmecánica y de la construcción en Baja California.',
    imagen: '',
    href: '',
    enlace: 'Leer más',
  },
  {
    etiqueta: 'Trayectoria',
    titulo: 'Nuestra historia',
    /* PENDIENTE */
    texto: 'Sucursales en Tijuana, Mexicali y Ensenada que abastecen de acero, ferretería y herramienta a toda la región.',
    imagen: '',
    href: '/sucursales',
    enlace: 'Ver sucursales',
  },
  {
    etiqueta: 'Obras',
    titulo: 'Nuestros proyectos',
    /* PENDIENTE */
    texto: 'Naves industriales, edificios, vivienda y herrería artística construidos con material de Aceros Frontera.',
    imagen: '',
    href: '',
    enlace: 'Ver proyectos',
  },
  {
    etiqueta: 'Productos',
    titulo: 'Catálogo',
    texto: 'Perfiles, lámina, varilla, tubería, ferretería y herramienta de las mejores marcas, con cotización por WhatsApp.',
    imagen: '',
    href: '/catalogo',
    enlace: 'Ver catálogo',
  },
  {
    etiqueta: 'Servicios',
    titulo: 'Nuestros servicios',
    texto: 'Fabricación de armex y lámina a la medida, corte de placa, entrega en obra y centro de servicio autorizado.',
    imagen: '',
    href: '/#servicios',
    enlace: 'Ver servicios',
  },
];
