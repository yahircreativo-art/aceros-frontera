import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { Core } from '@strapi/strapi';

/* Importa el catálogo desde los .md del frontend la primera vez que arranca,
   para no partir de una base vacía. Después el catálogo vive en Strapi. */

const CATALOGO = path.resolve(process.cwd(), '../frontend/src/content/catalogo');

function slugify(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* Habilita la lectura pública de la API de productos (rol público de
   users-permissions). Sin esto Strapi responde 403 a /api/productos. */
async function habilitarLecturaPublica(strapi: Core.Strapi): Promise<void> {
  const rol = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });

  if (!rol) return;

  const acciones = ['api::producto.producto.find', 'api::producto.producto.findone'];

  for (const action of acciones) {
    const existente = await strapi.db
      .query('plugin::users-permissions.permission')
      .findOne({ where: { action, role: { id: rol.id } } });

    if (existente) continue;

    await strapi.db
      .query('plugin::users-permissions.permission')
      .create({ data: { action, role: rol.id } });

    strapi.log.info(`Permiso público habilitado: ${action}`);
  }
}

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await habilitarLecturaPublica(strapi);

    const productos = strapi.documents('api::producto.producto');
    const total = await productos.count({});

    if (total > 0 || !fs.existsSync(CATALOGO)) return;

    const archivos = fs.readdirSync(CATALOGO).filter((archivo) => archivo.endsWith('.md'));

    for (const archivo of archivos) {
      const { data } = matter(fs.readFileSync(path.join(CATALOGO, archivo), 'utf8'));

      if (!data.nombre || !data.categoria) {
        strapi.log.warn(`Catálogo: ${archivo} ignorado (falta nombre o categoría).`);
        continue;
      }

      await productos.create({
        data: {
          nombre: String(data.nombre),
          slug: slugify(archivo.replace(/\.md$/, '')),
          sku: data.sku ? String(data.sku) : undefined,
          marca: data.marca ? String(data.marca) : undefined,
          categoria: String(data.categoria),
          precio: data.precio ?? null,
          precioAnterior: data.precioAnterior ?? null,
          rating: data.rating ?? 4.5,
          reviews: data.reviews ?? 0,
          stock: typeof data.stock === 'boolean' ? Number(data.stock) : (data.stock ?? 0),
          envioGratis: Boolean(data.envioGratis),
          destacado: Boolean(data.destacado),
          imagen: String(data.imagen),
          etiquetas: data.etiquetas ?? [],
          resumen: String(data.resumen ?? ''),
          especificaciones: data.especificaciones ?? {},
        },
      });
    }

    strapi.log.info(`Catálogo importado desde Markdown: ${archivos.length} archivo(s).`);
  },
};
