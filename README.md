# Ferremax · Plantilla de ferretería industrial

Plantilla de una página (one-page) para ferretería industrial y mayoreo, construida con
**Astro 7 + React 19 + Tailwind CSS 4**. El catálogo vive en archivos Markdown, el SEO en un
único JSON y todo el sistema visual en tokens de `global.css`.

## Stack

| Pieza | Uso |
| --- | --- |
| Astro | Estructura, render estático, content collections |
| React | Isla interactiva del catálogo (búsqueda y filtros) |
| Tailwind 4 | Utilidades generadas desde los tokens de `src/styles/global.css` |
| TypeScript | Esquema del catálogo y tipos compartidos |
| @astrojs/sitemap | `sitemap-index.xml` con las rutas del sitio |

## Comandos

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # genera dist/ + sitemap
npm run preview  # sirve el build
npm run check    # Astro + TypeScript
```

## Estructura

```
src/
├── components/
│   ├── Header.astro          # navegación + CTA WhatsApp
│   ├── Hero.astro            # hero con imagen de fondo
│   ├── Footer.astro          # datos de contacto y enlaces
│   ├── Logo.astro
│   ├── Seo.astro             # meta tags + JSON-LD desde seo.json
│   ├── catalog/
│   │   ├── Catalog.tsx       # isla React: búsqueda + filtros
│   │   ├── ProductCard.tsx
│   │   └── StarRating.tsx
│   └── ui/Icon.tsx
├── content/catalogo/         # un .md por producto
├── content.config.ts         # esquema (validación) del frontmatter
├── data/seo.json             # TODO el SEO: sitio + una entrada por página
├── layouts/Base.astro
├── lib/
│   ├── format.ts             # CLP, IVA, descuentos, normalización de texto
│   ├── seo.ts                # tipos y helpers del JSON
│   └── types.ts
├── pages/
│   ├── index.astro           # home: hero + catálogo
│   └── robots.txt.ts
└── styles/global.css         # tokens de diseño + base
```

## 1. Tokens en `global.css`

Todo el sistema visual está en el bloque `@theme` de
[`src/styles/global.css`](src/styles/global.css). Tailwind 4 convierte esas variables en
utilidades automáticamente:

```css
@theme {
  /* Color: --color-brand-600 → bg-brand-600, text-brand-600, border-brand-600… */
  --color-brand-600: #12703f;
  --color-accent-400: #f7c948;
  --color-ink-900: #1b2430;
  --color-canvas: #f6f7f9;
  --color-line: #e4e7ec;

  /* Tipografía: --text-sm → text-sm; --font-display → font-display */
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif;
  --text-display: clamp(2.5rem, 5vw, 4.25rem);
  --text-display--line-height: 1.02;
  --text-display--font-weight: 800;

  /* Forma y sombra: --radius-card → rounded-card; --shadow-card → shadow-card */
  --radius-field: 0.5rem;
  --radius-card: 0.75rem;
  --radius-panel: 1rem;
  --shadow-card: 0 1px 2px rgb(16 24 40 / 4%), 0 4px 12px rgb(16 24 40 / 4%);
}
```

Para recolorear el sitio basta cambiar la paleta `brand` / `accent` / `ink`. Los componentes
no usan colores sueltos: todos consumen estas variables.

Piezas clave del tema:

- `brand` — verde ferretería (acciones, precios, badges de stock).
- `accent` — amarillo seguridad (ofertas, CTA del hero, estrellas).
- `ink` — escala neutra de textos y bordes.
- `canvas`, `surface`, `line` — fondos y divisores semánticos.
- `rounded-field | card | panel`, `shadow-card | lift` — radios y profundidad.
- `container-page` (utilidad `@utility`) — ancho máximo 1248 px y padding fluido.

## 2. SEO en un solo JSON

[`src/data/seo.json`](src/data/seo.json) tiene dos bloques:

- `site`: nombre, razón social, dominio, teléfono, WhatsApp, email, dirección, horarios,
  redes, imagen social por defecto, tipo de negocio Schema.org.
- `pages`: una entrada por página (`home` hoy) con `title`, `description`, `keywords`,
  `robots`, `path`, `ogType` y `schemaType`.

`Base.astro` recibe `page` y renderiza `<Seo page="home" />`, que genera:

- `<title>`, description, keywords, robots, theme-color y canonical.
- Open Graph y Twitter Card.
- JSON-LD con `HardwareStore` (+ dirección y horarios), `WebSite` y `WebPage`.

`astro.config.mjs` lee `site.baseUrl` del mismo JSON, así el dominio canónico y el sitemap no se
duplican en dos lugares.

**Agregar una página nueva:** añade su objeto a `pages` en `seo.json`, crea el `.astro` en
`src/pages/` y pásale el id en el layout:

```astro
<Base page="contacto">…</Base>
```

El tipo `PageId` se deriva del JSON: si escribes un id inexistente, `npm run check` falla.

> Nota: el sitio es estático, así que los meta tags ya vienen en el HTML inicial (no dependen de
> JavaScript). El sitemap se genera en `npm run build`.

## 3. Catálogo en Markdown

Cada producto es un archivo en [`src/content/catalogo/`](src/content/catalogo/). El nombre del
archivo es el slug. El frontmatter se valida contra el esquema de
[`src/content.config.ts`](src/content.config.ts) en desarrollo y en build.

```md
---
sku: DCD794D2
nombre: Taladro percutor inalámbrico 20V Max Brushless
marca: DeWalt
categoria: Herramientas Eléctricas
precio: 189990            # CLP con IVA
precioAnterior: 254990    # opcional: activa el badge de descuento
rating: 4.8
reviews: 89
stock: 12                 # 0 = "Sobre pedido"
envioGratis: true         # opcional
destacado: true           # alimenta el filtro "Más vendidos"
imagen: /images/productos/taladro.svg
etiquetas: [oferta, brushless]
resumen: Taladro percutor 20V con motor brushless y maletín.
especificaciones:
  Voltaje: 20 V
  Piezas: 6               # los números se normalizan a texto
---

Descripción larga en **Markdown**.
```

Reglas útiles:

- `precio` y `precioAnterior` son números (sin puntos ni símbolos).
- `categoria` se agrupa sola en las pestañas del catálogo, en orden alfabético. Para renombrar
  una categoría, cámbiala en todos los `.md` que la usan.
- `precioAnterior` mayor que `precio` genera el `-X% OFF`.
- `imagen` es una ruta dentro de `public/`; reemplaza los SVG de ejemplo por fotos reales
  (mismo nombre o cambia la ruta). Recomendado: 4:3, 800×600 px o mayor.
- Los campos opcionales tienen valores por defecto; los obligatorios hacen fallar el build si
  faltan.

**Actualización automática:** en `npm run dev`, al guardar o borrar un `.md` Astro sincroniza la
colección y la página recarga con el catálogo nuevo. En `npm run build`, el catálogo, los filtros
y el sitemap se regeneran desde los archivos.

Búsqueda y filtros viven en [`Catalog.tsx`](src/components/catalog/Catalog.tsx):

- Busca en nombre, marca, SKU, categoría y etiquetas, ignorando mayúsculas y acentos
  (`electricas` encuentra `Herramientas Eléctricas`).
- Filtros: Todos · Más vendidos · Ofertas · una pestaña por categoría.
- El contador usa `aria-live` y el estado vacío ofrece limpiar los filtros.

## 4. Hero con imagen de fondo

El fondo está en `public/images/hero-bg.svg` y se aplica con la variable `--hero-image` al final
de `global.css`:

```css
:root {
  --hero-image: url("/images/hero-bg.svg");
}
```

Para usar una foto:

1. Copia tu imagen a `public/images/` (por ejemplo `hero.jpg`, 1920×1080).
2. Cambia la variable: `--hero-image: url("/images/hero.jpg");`

El hero ya incluye el degradado verde sobre la imagen para que el texto blanco tenga contraste.
Si tu foto es clara, sube la opacidad del degradado en
[`Hero.astro`](src/components/Hero.astro).

## 5. Datos de ejemplo

Nombre, RUT/razón social, dirección, teléfonos, correo, redes y precios son ficticios. Están
centralizados en `src/data/seo.json` (contacto y SEO) para reemplazarlos sin tocar componentes.
Los botones del catálogo abren WhatsApp con un mensaje prellenado usando `site.whatsapp`.

## Despliegue

`npm run build` genera un sitio estático en `dist/`. Súbelo a cualquier hosting estático
(Cloudflare Pages, Netlify, Vercel, Nginx). Antes de publicar, actualiza `site.baseUrl` en
`seo.json` con el dominio real.
