import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Lee argumentos de línea de comandos:
// node scripts/optimizar-imagenes.mjs [carpeta_origen] [carpeta_destino]
const defaultInput = path.resolve('public/images/productos');
const inputDir = process.argv[2] ? path.resolve(process.argv[2]) : defaultInput;
const outputDir = process.argv[3] ? path.resolve(process.argv[3]) : inputDir;

const rasterExtensions = new Set(['.jpg', '.jpeg', '.png', '.bmp', '.tiff']);
const MAX_DIMENSION = 1600; // Máximo 1600px (mantiene nitidez perfecta para e-commerce)
const TARGET_QUALITY = 82;  // Calidad WebP: produce archivos entre 80 KB y 350 KB (< 500 KB)

await mkdir(outputDir, { recursive: true });

console.log(`\n========================================`);
console.log(`OPTIMIZADOR DE IMÁGENES A WEBP (< 500 KB)`);
console.log(`========================================`);
console.log(`Carpeta origen:  ${inputDir}`);
console.log(`Carpeta destino: ${outputDir}`);
console.log(`Dimensiones máx: ${MAX_DIMENSION}x${MAX_DIMENSION} px`);
console.log(`----------------------------------------\n`);

let procesadas = 0;
let errores = 0;

async function buscarArchivos(dir) {
  let archivos = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await buscarArchivos(fullPath);
      archivos = archivos.concat(sub);
    } else if (entry.isFile() && rasterExtensions.has(path.extname(entry.name).toLowerCase())) {
      archivos.push(fullPath);
    }
  }
  return archivos;
}

try {
  const listaArchivos = await buscarArchivos(inputDir);
  console.log(`Se encontraron ${listaArchivos.length} imágenes para procesar.\n`);

  for (const archivo of listaArchivos) {
    const ext = path.extname(archivo);
    const nombreBase = path.basename(archivo, ext);
    const archivoDestino = path.join(outputDir, `${nombreBase}.webp`);

    try {
      // 1. Cargar imagen con Sharp
      let pipeline = sharp(archivo).rotate();

      // 2. Redimensionar si supera el tamaño máximo
      pipeline = pipeline.resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      });

      // 3. Convertir a WebP
      const buffer = await pipeline
        .webp({
          quality: TARGET_QUALITY,
          effort: 5,
        })
        .toBuffer();

      // 4. Si aún sobrepasara 500 KB, reajustar calidad automáticamente
      let finalBuffer = buffer;
      if (finalBuffer.length > 500 * 1024) {
        finalBuffer = await sharp(archivo)
          .rotate()
          .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 75, effort: 6 })
          .toBuffer();
      }

      await sharp(finalBuffer).toFile(archivoDestino);

      const pesoKB = (finalBuffer.length / 1024).toFixed(1);
      console.log(`✔ [OK] ${nombreBase}.webp (${pesoKB} KB)`);
      procesadas++;
    } catch (err) {
      console.error(`✖ [ERROR] No se pudo procesar ${path.basename(archivo)}: ${err.message}`);
      errores++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Completado: ${procesadas} optimizadas, ${errores} errores.`);
  console.log(`========================================\n`);
} catch (err) {
  console.error(`Error al acceder a la carpeta: ${err.message}`);
}
