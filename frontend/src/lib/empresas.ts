import { readdirSync, statSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

const EXTENSIONES = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg']);

export interface EmpresaAliada {
  nombre: string;
  imagen: string;
}

/**
 * Lee los logos de public/images/empresas en tiempo de build.
 * El nombre del archivo se usa como texto alternativo (guiones y guiones bajos se vuelven espacios).
 */
export function obtenerEmpresasAliadas(): EmpresaAliada[] {
  const carpeta = join(process.cwd(), 'public', 'images', 'empresas');

  let archivos: string[] = [];
  try {
    archivos = readdirSync(carpeta);
  } catch {
    return [];
  }

  return archivos
    .filter((archivo) => EXTENSIONES.has(extname(archivo).toLowerCase()))
    .filter((archivo) => {
      try {
        return statSync(join(carpeta, archivo)).isFile();
      } catch {
        return false;
      }
    })
    .sort((a, b) => a.localeCompare(b, 'es', { numeric: true }))
    .map((archivo) => ({
      nombre: basename(archivo, extname(archivo)).replace(/[-_]+/g, ' ').trim(),
      imagen: `${import.meta.env.BASE_URL}images/empresas/${encodeURIComponent(archivo)}`,
    }));
}
