# Aceros Frontera

Dos aplicaciones separadas:

```
frontend/   Astro + React + Tailwind 4 → sitio estático (catálogo, SEO, hero)
backend/    Strapi 5 → API y panel de administración para el catálogo
```

Cada carpeta tiene su propio `package.json` y sus propias dependencias: se instalan, se
construyen y se despliegan por separado.

## Arrancar

```bash
# backend (Strapi, http://127.0.0.1:1337)
cd backend && npm install && npm run develop

# frontend (Astro, http://localhost:4321)
cd frontend && pnpm install && pnpm dev
```

Si Strapi no está corriendo, el frontend sigue construyendo con el catálogo en Markdown de
`frontend/src/content/catalogo/`.

Documentación detallada de cada app en [frontend/README.md](frontend/README.md) y
[backend/README.md](backend/README.md).
