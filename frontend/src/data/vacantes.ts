/**
 * Vacantes de la "Bolsa de trabajo" de la portada.
 * IMPORTANTE: estas tres son las vacantes de ejemplo del diseño en Figma.
 * Reemplázalas por las vacantes reales (o deja el arreglo vacío para mostrar
 * solo la invitación a enviar CV).
 */
export interface Vacante {
  puesto: string;
  descripcion: string;
  ciudad: string;
  jornada: string;
}

/* Sin vacantes publicadas (acerosfrontera.com no tiene ninguna). Agrega aquí las reales:
   { puesto: 'Vendedor de mostrador', descripcion: '…', ciudad: 'Tijuana', jornada: 'Tiempo completo' } */
export const vacantes: Vacante[] = [];
