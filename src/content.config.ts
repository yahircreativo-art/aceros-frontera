import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/* Cada archivo de src/content/catalogo/*.md es un producto.
   Los campos obligatorios se validan en build; los opcionales tienen default. */
const productos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/catalogo' }),
  schema: z.object({
    sku: z.string().optional(),
    nombre: z.string(),
    marca: z.string().optional(),
    categoria: z.string(),
    precio: z.number().positive().optional(),
    precioAnterior: z.number().positive().optional(),
    rating: z.number().min(0).max(5).default(4.5),
    reviews: z.number().int().nonnegative().default(0),
    stock: z.number().int().nonnegative().optional(),
    envioGratis: z.boolean().default(false),
    destacado: z.boolean().default(false),
    imagen: z.string(),
    etiquetas: z.array(z.string()).default([]),
    resumen: z.string(),
    // coerce: permite escribir `Piezas: 6` en YAML y lo normaliza a texto.
    especificaciones: z.record(z.string(), z.coerce.string()).optional(),
  }),
});

export const collections = { productos };
