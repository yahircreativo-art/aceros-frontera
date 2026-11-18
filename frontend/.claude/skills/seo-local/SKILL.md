---
name: seo-local
description: Audit and improve SEO for the Aceros Frontera Astro site (local business with 6 branches in Tijuana, Mexicali and Ensenada). Use when the user asks about SEO, posicionamiento, Google, meta tags, datos estructurados, sitemap, robots, velocidad/Core Web Vitals, or before publishing a new page or section.
---

# SEO local · Aceros Frontera

Sitio Astro estático (`frontend/`). Negocio local: distribuidor de acero y ferretería con **6 sucursales** en Baja California. El objetivo SEO es aparecer en búsquedas locales ("acero en Tijuana", "PTR Ensenada", "lámina R-72 Mexicali") y que Google muestre teléfono, horario y ubicación de cada sucursal.

Responde siempre en español. Usa solo datos reales del proyecto; si falta un dato (año de fundación, RFC, horario de una sucursal), pregúntalo en lugar de inventarlo.

## Dónde vive cada cosa (no dupliques)

| Qué | Archivo |
|---|---|
| Título, descripción, keywords, robots, tipo de schema por página | `src/data/seo.json` → `pages[<PageId>]` |
| Datos del negocio (nombre, teléfono, email, dirección principal, horario, redes) | `src/data/seo.json` → `site` |
| Render de `<title>`, meta, canonical, Open Graph, Twitter y JSON-LD | `src/components/Seo.astro` (lo usa `src/layouts/Base.astro`) |
| Sucursales reales (dirección, colonia, CP, teléfonos, horarios, coordenadas) | `src/data/sucursales.ts` |
| Sitemap y robots | `@astrojs/sitemap` en `astro.config.mjs` (`site` y `base` vienen de `SITE_URL` / `SITE_BASE_PATH`) y `src/pages/robots.txt.ts` |
| Páginas dinámicas | `src/pages/catalogo/[categoria].astro` y `src/pages/producto/[slug].astro` (`getStaticPaths` con productos de Supabase): títulos y descripciones se pasan como props a `<Base>` |
| Rutas internas con base | `rutaInterna()` y `assetUrl()` en `src/lib/asset-url.ts` |

Una página nueva = agregar su `PageId` en `src/lib/seo` y su entrada en `seo.json`, y pasar `page` a `<Base>`. No escribas `<title>` ni meta a mano en las páginas.

## Auditoría (hazla en este orden y reporta en tabla: punto · estado · arreglo)

1. **Por página** (`src/pages/**/*.astro`):
   - Título único de 50–60 caracteres, con producto o servicio + ciudad cuando aplique.
   - Descripción única de 140–160 caracteres que diga qué encuentra el usuario.
   - **Un solo `<h1>`.** Ojo: los heroes y propuestas de sección traen su propio h1 o h2. Si en una página hay dos heroes, o un hero más `PageHero`, hay dos h1.
   - Encabezados en orden (h2 → h3), sin saltos.
   - Canonical correcto con la `base` del sitio.
2. **Datos estructurados**:
   - Hoy `Seo.astro` publica un solo `HardwareStore` con la dirección principal.
   - Recomienda añadir un `HardwareStore` por sucursal, generado desde `src/data/sucursales.ts`: `address` con `postalCode` si existe, `telephone`, `geo` con las coordenadas, `openingHoursSpecification` y `parentOrganization` apuntando a `#organization`.
   - Valida que el JSON resultante sea parseable.
3. **Rastreo**:
   - `robots.txt` lo genera `src/pages/robots.txt.ts`, que apunta a `sitemap-index.xml` con la base. Si alguna sección no debe indexarse, agrégala ahí.
   - Que las páginas de prueba (`src/pages/zz-*`, `*test*`) no lleguen a producción.
   - `noindex` solo donde corresponda.
4. **Imágenes**:
   - `alt` descriptivo en las imágenes con contenido; `alt=""` solo si son decorativas.
   - `width` y `height` o `aspect-ratio` para no causar saltos de diseño (CLS).
   - `loading="lazy"` excepto la imagen principal (LCP); WebP con peso razonable.
5. **Velocidad (Core Web Vitals)**:
   - La imagen o SVG principal del hero no debe ser lazy.
   - Las fuentes de Google se cargan con `display=swap` (ya está así).
   - Revisa scripts pesados por encima del pliegue y animaciones que corran fuera de pantalla (pausar con IntersectionObserver, como hace `obra-camara.ts`).
6. **Contenido local**:
   - Las ciudades aparecen en textos visibles, no solo en metadatos.
   - Cada sucursal tiene dirección y teléfono como texto rastreable (no solo en imágenes o mapas).
   - Los enlaces internos llevan a `/catalogo/<categoria>` y `/sucursales`.
7. **Consistencia de datos**: compara el horario y el teléfono de `seo.json` con los de `sucursales.ts`. Si difieren, señálalo y pregunta cuál es el correcto. Google penaliza la información de negocio contradictoria.

`<meta name="keywords">` no influye en Google: no inviertas tiempo en él.

## Verificación

- `npx astro check` sin errores.
- `npx astro build` y revisa en `dist/` el `<head>` de la página tocada: título, descripción, canonical y JSON-LD (pásalo por `JSON.parse`).
- Confirma que existen `sitemap-index.xml` y `robots.txt` en `dist/`.
- Si hay cambios de JSON-LD, sugiere validarlos en https://search.google.com/test/rich-results después de publicar. No envíes nada a servicios externos sin permiso del usuario.
