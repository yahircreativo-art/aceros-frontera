// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// El dominio vive en src/data/seo.json para no duplicar la configuración SEO.
const seo = JSON.parse(
  readFileSync(new URL('./src/data/seo.json', import.meta.url), 'utf8'),
);

export default defineConfig({
  site: process.env.SITE_URL ?? seo.site.baseUrl,
  base: process.env.SITE_BASE_PATH ?? '/',
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
