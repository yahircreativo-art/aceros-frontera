/**
 * Reseñas de clientes para la sección "Reseñas" de la portada.
 *
 * ⚠ Las que llevan `ejemplo: true` son TEXTOS DE EJEMPLO para diseñar las
 * propuestas: no son opiniones reales. Mientras quede alguna, las secciones
 * muestran el aviso "Reseñas de ejemplo" y no deben publicarse.
 * Para usar las reales: copia de la ficha de Google de la sucursal las de 5
 * estrellas (nombre como aparece, texto tal cual y fecha) y quita `ejemplo`.
 * No agregues reseñas en el JSON-LD (schema Review): Google no lo permite para
 * reseñas copiadas de su propia ficha.
 */

export type TemaResena = 'atencion' | 'surtido' | 'servicio' | 'entrega';

export interface Resena {
  id: string;
  /** Nombre como aparece en Google (o iniciales). */
  nombre: string;
  estrellas: 1 | 2 | 3 | 4 | 5;
  texto: string;
  /** id de src/data/sucursales.ts */
  sucursal: string;
  fuente: 'Google' | 'Facebook';
  /** Como la muestra Google ("hace 2 meses"). */
  fecha: string;
  tema: TemaResena;
  /** Texto de ejemplo, no es una reseña real. */
  ejemplo?: boolean;
}

export const temas: Record<TemaResena, string> = {
  atencion: 'Atención',
  surtido: 'Surtido',
  servicio: 'Cortes y armex',
  entrega: 'Entregas',
};

export const resenas: Resena[] = [
  { id: 'e1', nombre: 'Cliente de ejemplo 1', estrellas: 5, sucursal: 'cucapah', fuente: 'Google', fecha: 'hace 1 mes', tema: 'atencion', ejemplo: true,
    texto: 'Me atendieron rápido y me ayudaron a calcular cuánto material necesitaba para el techo. Muy amables en mostrador.' },
  { id: 'e2', nombre: 'Cliente de ejemplo 2', estrellas: 5, sucursal: 'cucapah', fuente: 'Google', fecha: 'hace 2 meses', tema: 'surtido', ejemplo: true,
    texto: 'Encontré todo en un solo lugar: PTR, ángulo, soldadura y discos. Ya no tuve que dar vueltas por otras ferreterías.' },
  { id: 'e3', nombre: 'Cliente de ejemplo 3', estrellas: 5, sucursal: 'cucapah', fuente: 'Google', fecha: 'hace 2 meses', tema: 'servicio', ejemplo: true,
    texto: 'Les llevé las medidas de unas placas y me las entregaron cortadas como las pedí. Buen trabajo.' },
  { id: 'e4', nombre: 'Cliente de ejemplo 4', estrellas: 5, sucursal: 'cucapah', fuente: 'Google', fecha: 'hace 3 meses', tema: 'entrega', ejemplo: true,
    texto: 'Pedí varilla y malla para una losa y me la llevaron a la obra. Todo completo.' },
  { id: 'e5', nombre: 'Cliente de ejemplo 5', estrellas: 5, sucursal: 'cucapah', fuente: 'Google', fecha: 'hace 4 meses', tema: 'atencion', ejemplo: true,
    texto: 'Buena atención y explican bien las diferencias entre calibres. Se nota que saben de acero.' },
  { id: 'e6', nombre: 'Cliente de ejemplo 6', estrellas: 5, sucursal: 'cucapah', fuente: 'Google', fecha: 'hace 5 meses', tema: 'servicio', ejemplo: true,
    texto: 'Compré armex para los castillos de mi casa y salió justo a la medida. Me ahorró mucho tiempo.' },
  { id: 'e7', nombre: 'Cliente de ejemplo 7', estrellas: 5, sucursal: 'cucapah', fuente: 'Google', fecha: 'hace 6 meses', tema: 'surtido', ejemplo: true,
    texto: 'Soy herrero y aquí surto casi todo mi material. Tienen buen surtido de perfiles y lámina.' },
  { id: 'e8', nombre: 'Cliente de ejemplo 8', estrellas: 5, sucursal: 'cucapah', fuente: 'Google', fecha: 'hace 8 meses', tema: 'entrega', ejemplo: true,
    texto: 'Coticé por WhatsApp, me contestaron y pasé a recoger el material ya separado. Muy práctico.' },
];

/** Hay al menos una reseña de ejemplo: las secciones muestran el aviso. */
export const hayResenasDeEjemplo = resenas.some((r) => r.ejemplo);

/**
 * Calificación de la ficha de Google de la sucursal Cucapah (dato real,
 * visto en Google Maps el 19 nov 2026). Actualízala cuando cambie.
 */
export const fichaGoogle = {
  sucursal: 'cucapah',
  calificacion: 4.5,
  revisado: '19 nov 2026',
  url: 'https://www.google.com/maps/place/Aceros+Frontera/@32.5118193,-116.8974772,17z/data=!3m1!4b1!4m6!3m5!1s0x80d938b184803107:0xcf4d878a6e3e3f35!8m2!3d32.5118193!4d-116.8974772!16s%2Fg%2F11b6_sq5zb',
};
