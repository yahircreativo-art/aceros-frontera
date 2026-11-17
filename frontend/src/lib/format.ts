/** Texto en minúsculas, sin acentos ni espacios extremos, para comparar y buscar. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}
