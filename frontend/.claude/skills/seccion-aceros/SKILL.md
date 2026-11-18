---
name: seccion-aceros
description: Conventions for building new section components or proposals (hero, navbar, nosotros, catálogo, contacto, etc.) for the Aceros Frontera Astro site. Use whenever the user asks for "propuestas", "variantes", a new section, or changes to an existing section's design or animation.
---

# Secciones y propuestas · Aceros Frontera

Astro 7 + Tailwind 4 en `frontend/`. El usuario escribe en español, pega los componentes a mano en `src/pages/index.astro` para previsualizarlos y suele pedir **5 propuestas** (A–E) por sección. Responde en español.

## Dirección de diseño: "plano de taller"

Úsala también con la skill `frontend-design`. Lo que pida el usuario manda sobre estas reglas.

- **Cota en vez de etiqueta en mayúsculas.**
  - Encima o debajo del titular va `<Cota texto="…" />` (`src/components/ui/Cota.astro`) con un **dato real y medible** en minúsculas, por ejemplo "6 sucursales en Tijuana, Mexicali y Ensenada".
  - Nada de etiquetas en mayúsculas sobre cada título.
- **Titulares** en Barlow Condensed 800, mayúsculas, **de un solo color**. No resaltes una sola palabra o frase en amarillo.
- **Esquinas cortadas (chaflán)**, como placa de acero cortada:
  - Usa la utilidad `chamfer` con `--chamfer`, o un `clip-path` equivalente. Nada de píldoras ni tarjetas `rounded-2xl`.
  - Como `clip-path` corta el contorno de foco, dibuja el foco por dentro: `box-shadow: inset 0 0 0 2px …`.
- **Botones:** usa el componente de marca `src/components/ui/Button.astro`. Las variantes son `primary` (verde), `secondary` (amarillo), `dark`, `outline`, `tertiary`, `ghost` y `link`.
  - No pases a su `href` una ruta que ya tenga la base (`rutaInterna`); el componente la agrega solo.
- **Sin muletillas de diseño genérico:**
  - Sin "→" ni "↗" pegados al texto.
  - Sin cadenas unidas con " · ".
  - Sin etiquetas monoespaciadas tipo `FIG_01`.
  - Numeración solo si es una secuencia real (pasos de un formulario, plano 1 de 3).
- **Lo memorable** son los dibujos isométricos de línea:
  - `src/lib/construcciones.ts` + `src/lib/obra-camara.ts` para las obras.
  - `src/lib/planos.ts` + `src/components/catalogo-propuestas/PlanoLinea.astro` para las piezas.
  - Todo lo demás, sobrio.
- **Copys:**
  - Verbos claros que digan lo que pasa ("Cotizar por WhatsApp", no "Contáctanos").
  - Sin cifras inventadas (nada de "24 h", "+500 clientes").
- **Paleta** (tokens de `src/styles/global.css`):
  - `green-800` #004a34, `green-900`, `green-950`.
  - `accent-primary` #eac02b.
  - `neutral-100` / `neutral-950`.
  - No uses colores sueltos.

## Estructura de archivos

- **Propuestas:** `src/components/<seccion>-propuestas/<Seccion>A..E.astro` (o `navbars/`, `heros/`, `nosotros/`).
- **Datos compartidos:** un `<seccion>-data.ts` en la misma carpeta que reexporta datos reales.
  - Sucursales: `src/data/sucursales.ts`.
  - Familias: `src/data/familias.ts`.
  - Contacto: `siteSeo` y `whatsappUrl()` de `src/lib/seo`.
  - Productos: el prop `productos` de `obtenerProductos()`.
- **Helpers que ya existen, no los dupliques:**
  - `rutaInterna()` y `assetUrl()` (`src/lib/asset-url.ts`).
  - `progresoScroll()`, `alAparecer()` y `contar()` (`src/lib/scroll-progreso.ts`).
  - `estado()` y `distanciaKm()` (`src/lib/horario.ts`, horario en hora de Tijuana).
  - `escribir()` (`src/lib/maquina-escribir.ts`).
- **Una sola instancia por página:** cada componente lleva `id` de sección y hooks `data-*`. El `<script>` busca su raíz con `document.querySelector('[data-xxx]')`.

## Reglas técnicas

- **Estilos `<style>` con alcance (scoped):**
  - Para clases que agrega JS o que van en componentes hijos (`Pictogram`, `Button`), usa `:global(...)`.
  - Cuida la especificidad. `:global(html.js) .x` le gana a `.x.is-on`, así que el estado activo también debe llevar `:global(html.js)`.
- **Siempre:**
  - Respaldo sin JS: `:global(html:not(.js)) …` muestra todo.
  - `@media (prefers-reduced-motion: reduce)`: sin animación y con el contenido visible.
  - Foco visible con teclado.
- **Grids en celular:** usa `grid-cols-[minmax(0,1fr)]` y `min-w-0` en los hijos. Si no, el contenido ancho (carruseles, pistas de pasos) se sale de la pantalla.
- **Movimiento:** un momento orquestado por sección o el que pida el usuario. Que las animaciones respondan a acciones del usuario y que se pausen fuera de pantalla.

## Verificación (antes de entregar)

1. **Tipos:** `npx astro check` debe dar 0 errores.
2. **Página temporal:**
   - Crea `src/pages/zz-<x>.astro` que renderice el componente dentro de `Base` (pasando `productos` si hace falta).
   - Pídela a `http://localhost:4321/zz-<x>` (el servidor de desarrollo suele estar ya corriendo) y comprueba que responda 200.
   - Los parámetros `?query` no funcionan en el modo estático: usa una página por componente.
3. **Capturas:**
   - Escritorio: Chrome sin interfaz (`--headless=new --screenshot --window-size=1440,1000 --force-prefers-reduced-motion`).
   - Celular: Chrome sin interfaz tiene un **ancho mínimo de 512 px**. Para un celular real, abre un HTML local con un `<iframe width="390">` de la página.
   - Lee las capturas y corrige lo que se vea mal.
4. **Limpieza:** borra las páginas `zz-*` y los archivos temporales.
5. **Entrega:** responde en español con una tabla de propuestas y cómo importarlas (`import X from "../components/…"` en `index.astro`). Di con claridad qué verificaste y qué no.
