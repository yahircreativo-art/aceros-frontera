import { readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const imageRoot = fileURLToPath(new URL('../public/images/', import.meta.url));
const rasterExtensions = new Set(['.jpg', '.jpeg', '.png']);
let converted = 0;
let upToDate = 0;

async function convertDirectory(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await convertDirectory(sourcePath);
      continue;
    }

    if (!entry.isFile() || !rasterExtensions.has(path.extname(entry.name).toLowerCase())) {
      continue;
    }

    const outputPath = path.join(directory, `${path.basename(entry.name, path.extname(entry.name))}.webp`);
    const sourceInfo = await stat(sourcePath);

    try {
      const outputInfo = await stat(outputPath);
      if (outputInfo.mtimeMs >= sourceInfo.mtimeMs) {
        upToDate += 1;
        continue;
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    await sharp(sourcePath)
      .rotate()
      .webp({ quality: 82, effort: 5 })
      .toFile(outputPath);

    converted += 1;
    console.log(`Generated ${path.relative(imageRoot, outputPath)}`);
  }
}

await convertDirectory(imageRoot);
console.log(`WebP images: ${converted} generated, ${upToDate} already up to date.`);