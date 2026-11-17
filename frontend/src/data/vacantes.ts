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

export const vacantes: Vacante[] = [
  {
    puesto: 'Jefe de almacén',
    descripcion: 'Coordina entradas, salidas e inventario del almacén.',
    ciudad: 'Tijuana',
    jornada: 'Tiempo completo',
  },
  {
    puesto: 'Chofer de reparto',
    descripcion: 'Entrega de material en obra con unidades de la empresa.',
    ciudad: 'Tijuana',
    jornada: 'Tiempo completo',
  },
  {
    puesto: 'Vendedor de mostrador',
    descripcion: 'Atención a clientes, cotizaciones y cierre de ventas.',
    ciudad: 'Mexicali',
    jornada: 'Tiempo completo',
  },
];
