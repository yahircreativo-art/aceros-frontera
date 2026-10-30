import { readdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* postbuild: deja dist/ listo para publicar.
   - Los productos se sirven en WebP, así que los PNG/JPG originales solo pesan:
     se retiran conservando los dos rasterales sí referenciados (favicon e
     imagen social).
   - Además borra los .DS_Store que macOS deja en public/ y que Astro copia. */

const distDir = fileURLToPath(new URL('../dist/', import.meta.url));
const extensiones = new Set(['.png', '.jpg', '.jpeg']);
const conservar = new Set(['/favicon.png', '/images/og-default.jpg']);
const basuraSistema = new Set(['.DS_Store', 'Thumbs.db']);

let eliminados = 0;
let bytes = 0;

async function recorrer(dir) {
  const entradas = await readdir(dir, { withFileTypes: true });

  for (const entrada of entradas) {
    const ruta = path.join(dir, entrada.name);

    if (entrada.isDirectory()) {
      await recorrer(ruta);
      continue;
    }

    if (!entrada.isFile()) continue;

    const esBasura = basuraSistema.has(entrada.name);
    const esRasterUtil = extensiones.has(path.extname(entrada.name).toLowerCase());
    if (!esBasura && !esRasterUtil) continue;

    const relativa = `/${path.relative(distDir, ruta).split(path.sep).join('/')}`;
    if (conservar.has(relativa)) continue;

    const info = await stat(ruta);
    await unlink(ruta);
    eliminados += 1;
    bytes += info.size;
    console.log(`Removed ${relativa} (${Math.round(info.size / 1024)} KB)`);
  }
}

await recorrer(distDir);
console.log(`dist: ${eliminados} archivo(s) retirado(s), ${Math.round(bytes / 1024)} KB liberados.`);
