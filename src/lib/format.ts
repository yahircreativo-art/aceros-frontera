const formateadorCLP = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

export function formatCLP(valor: number): string {
  return formateadorCLP.format(valor);
}

/** Precio neto para la nota "Contado: $X + IVA" (IVA Chile 19%). */
export function precioNeto(precio: number): number {
  return Math.round(precio / 1.19);
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
