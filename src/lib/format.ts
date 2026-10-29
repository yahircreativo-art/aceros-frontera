const formateadorCLP = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

export function formatCLP(valor: number): string {
  return formateadorCLP.format(valor);
}

/** Precio antes de IVA mexicano (16%) para la nota "Contado: $X + IVA". */
export function precioNeto(precio: number): number {
  return Math.round(precio / 1.16);
}

export function calcularDescuento(precio: number, precioAnterior?: number): number | null {
  if (!precioAnterior || precioAnterior <= precio) return null;
  return Math.round(((precioAnterior - precio) / precioAnterior) * 100);
}

export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
