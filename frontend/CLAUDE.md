# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Website for **Aceros Frontera**, a steel and hardware distributor with 6 branches in Tijuana, Mexicali and Ensenada (Baja California). The owner writes in Spanish: answer in Spanish, and keep code identifiers and comments in Spanish to match the codebase.

The READMEs are partly stale. `../README.md` mentions a Strapi `backend/` and a Markdown catalog in `src/content/`, and `README.md` describes the "Ferremax" template it started from. Neither the backend nor `src/content/` exists, and the catalog comes only from Supabase.

## Commands

Run all commands in `frontend/`. CI uses `npm` with `package-lock.json`, not pnpm.

```bash
npm run dev      # http://localhost:4321 (predev converts public/images/** to WebP)
npm run build    # prebuild WebP → astro build → postbuild scripts/limpiar-dist.mjs (removes PNG/JPG from dist)
npm run preview
npm run check    # astro check (types + .astro). The only automated check: there are no tests or linter.
npm run optimizar-imagenes
```

A dev server is often already running on :4321. Check before starting another one.

`.env` holds the Supabase settings:
- `SUPABASE_URL` and `SUPABASE_ANON_KEY`;
- optional: `SUPABASE_PRODUCTS_TABLE` (default `MASTER_PRODUCTOS`), `SUPABASE_DESTACADOS_TABLE` (`Promociones`), `SUPABASE_PROMOS_BUCKET`, `SITE_URL`, `SITE_BASE_PATH`.

`obtenerProductos()` never throws: without credentials, or if Supabase fails, it returns `[]` and the site still builds with an empty catalog. It is memoized (one download per build) and pages through the table in blocks of 1000. Never commit `.env` or `../../password.txt`.

Deploy: `../.github/workflows/deploy-pages.yml` builds `frontend/` on push to `main` and publishes it to GitHub Pages. In that case the site lives under a sub-path, so `base` is not `/`.

## Architecture

**Static Astro 7 site + Tailwind 4 + React 19 islands.** Pages live in `src/pages/`: `index`, `catalogo`, `catalogo/[categoria]`, `producto/[slug]`, `acero/[familia]` (fixed pages for steel families that have no Supabase category), `nosotros`, `sucursales`, `contacto`, `buscar.json.ts` (light search index) and `robots.txt.ts`.

- **Data at build time.** Each page calls `await obtenerProductos()` (`src/lib/productos.ts` → `supabase-productos.ts`, which maps Spanish columns such as `"Categorías"` and `"Imágenes"` to the `Producto` type in `lib/types.ts`).
  - `getStaticPaths` in `catalogo/[categoria]` and `producto/[slug]` generates one page per category or product (`lib/categorias.ts`, `lib/rutas-producto.ts`).
  - The search (`components/catalog/HeaderSearch.tsx`) loads `/buscar.json` on first focus; never pass the full product list to an island (use `paraTarjetas()` for `Catalog.tsx`).
  - Promos come from `lib/destacados.ts` (Supabase table + storage bucket).
- **Base path.** Never write internal URLs or `public/` paths by hand.
  - Use `rutaInterna()` and `assetUrl()` from `src/lib/asset-url.ts`.
  - The `Button` component already applies `rutaInterna` to its `href`, so do not apply it twice.
- **One source of truth for SEO.** `src/data/seo.json` holds `site` (name, phone, WhatsApp, email, address, hours, socials) and `pages[PageId]`.
  - `PageId` is derived from the JSON (`lib/seo.ts`). `Base.astro` receives `page` and renders `components/Seo.astro` (meta, canonical with trailing slash, OG, JSON-LD: organization + one `HardwareStore` per branch + `WebSite` + `WebPage`). Pages can pass `image`, `ogType` and `extraLd` (e.g. `Product`, `BreadcrumbList`) through `Base`.
  - `astro.config.mjs` reads the domain from that JSON. The sitemap comes from `@astrojs/sitemap` and `robots.txt` from `src/pages/robots.txt.ts`.
  - `siteSeo` and `whatsappUrl(msg)` come from `lib/seo.ts`. Every quote request opens WhatsApp; there is no email backend.
- **Real business data** lives in `src/data/`: `sucursales.ts` (6 branches with phones, hours, coordinates, plus `telHref`, `rutaUrl`, `mapaEmbed`), `familias.ts` (7 product families with pictograms and `rutaFamilia()`), `nosotros.ts` and `vacantes.ts`. Use only this data. Do not invent figures or claims.
- **Layout.**
  - `layouts/Base.astro` sets `html.js` early and runs the `.reveal` → `.is-visible` scroll observer and the parallax of `.pattern-placa`. It also holds the floating WhatsApp and email buttons.
  - The header is **not** in `Base`: every page imports `navbars/NavbarC.astro` as `Header` and passes it `productos`. It is 72 px tall, so section anchors use `scroll-mt-24`.
- **Design system** in `src/styles/global.css` (Tailwind 4 `@theme`).
  - Tokens: `green-*`, `yellow-*` (`accent-primary` #eac02b), `neutral-*` and semantic `text-*`/`surface-*`.
  - Fonts: Barlow Condensed (display) and Montserrat.
  - Utilities: `type-*`, `container-page` (gutter `--container-gutter`), `chamfer`/`btn-chamfer` (cut corner, the brand shape), `pattern-placa`/`pattern-diamante`, `text-outline`.
  - UI components: `components/ui/` (`Button`, `Pictogram`, `SectionHeading`, `SectionTag`, `Cota`).
- **Section proposals.** The owner asks for A–E variants and previews them by changing the import in `src/pages/index.astro`.
  - They live in `components/{navbars,heros,nosotros,contacto-propuestas,catalogo-propuestas}/`, each with a `*-data.ts` of shared data.
  - Original Figma components: `components/home/`, `components/contacto/`.
- **Isometric line drawings** (the most distinctive element of the site):
  - `lib/planos.ts` extrudes cross-sections (IPR, PTR, angle, tube, R-72 sheet) into SVG paths drawn with a mask (`home/PlanoDibujo.astro`, `catalogo-propuestas/PlanoLinea.astro`).
  - `lib/construcciones.ts` + `lib/obra-camara.ts` animate building, factory and house construction with an orthographic camera (`heros/HeroG.astro`).
  - Shared helpers: `lib/scroll-progreso.ts` (`progresoScroll` → `--p`, `alAparecer`, `contar`), `lib/maquina-escribir.ts`, `lib/horario.ts` (open/closed in Tijuana time).

## Conventions that matter

- **Component scripts:**
  - Use `<script>` with `data-*` hooks and look up the root with `querySelector('[data-x]')`; each section appears once per page.
  - Classes added from JS, or meant for child components, need `:global(...)` inside scoped `<style>`.
- **Specificity:** with `:global(html.js) .x { opacity:0 }`, the active state also needs `:global(html.js)` to win.
- **Accessibility and motion:**
  - Every animation must respect `prefers-reduced-motion` and render complete without JS (`html:not(.js)`).
  - `chamfer` (clip-path) cuts off focus outlines, so draw focus with `inset` box-shadow.
- **Mobile grids:** use `grid-cols-[minmax(0,1fr)]` and `min-w-0` in mobile grids that contain wide tracks or carousels; without them the content overflows the screen.
- **Design direction ("plano de taller"):**
  - Above or below headings, use `<Cota>` with a real fact, not an all-caps eyebrow.
  - Headings in a single color, with no accented word.
  - Chamfered corners instead of pills or `rounded-2xl`.
  - No `→`/`↗` appended to text, no ` · ` strings, no monospace labels.
  - Numbering only for real sequences.
  - Project skills in `.claude/skills/`: `seccion-aceros` (how to build and verify sections) and `seo-local`.
- **Visual verification:**
  - Create a temporary page `src/pages/zz-*.astro`; `?query` params do not work in static mode. Then take headless Chrome screenshots.
  - Headless Chrome has a minimum width of 512 px: for 390 px mobile, embed the page in a local HTML file with `<iframe width="390">`.
  - Delete the temporary pages afterwards.
