# 🚀 Getting started with Strapi

Strapi comes with a full featured [Command Line Interface](https://docs.strapi.io/dev-docs/cli) (CLI) which lets you scaffold and manage your project in seconds.

### `develop`

Start your Strapi application with autoReload enabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-develop)

```
npm run develop
# or
yarn develop
```

### `start`

Start your Strapi application with autoReload disabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-start)

```
npm run start
# or
yarn start
```

### `build`

Build your admin panel. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-build)

```
npm run build
# or
yarn build
```

## ⚙️ Deployment

Strapi gives you many possible deployment options for your project including [Strapi Cloud](https://cloud.strapi.io). Browse the [deployment section of the documentation](https://docs.strapi.io/dev-docs/deployment) to find the best solution for your use case.

```
yarn strapi deploy
```

## 📚 Learn more

- [Resource center](https://strapi.io/resource-center) - Strapi resource center.
- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation.
- [Strapi tutorials](https://strapi.io/tutorials) - List of tutorials made by the core team and the community.
- [Strapi blog](https://strapi.io/blog) - Official Strapi blog containing articles made by the Strapi team and the community.
- [Changelog](https://strapi.io/changelog) - Find out about the Strapi product updates, new features and general improvements.

Feel free to check out the [Strapi GitHub repository](https://github.com/strapi/strapi). Your feedback and contributions are welcome!

## ✨ Community

- [Discord](https://discord.strapi.io) - Come chat with the Strapi community including the core team.
- [Forum](https://forum.strapi.io/) - Place to discuss, ask questions and find answers, show your Strapi project and get feedback or just talk with other Community members.
- [Awesome Strapi](https://github.com/strapi/awesome-strapi) - A curated list of awesome things related to Strapi.

---

<sub>🤫 Psst! [Strapi is hiring](https://strapi.io/careers).</sub>

---

## Qué hay en este backend

- **Content type `Producto`** (`src/api/producto/`): nombre, slug, SKU, marca, categoría,
  precio, precio anterior, rating, reseñas, stock, envío gratis, destacado, imagen, etiquetas
  (JSON), resumen y especificaciones (JSON). Rutas/controladores/servicios core de Strapi.
- **Seed** (`src/index.ts`): la primera vez que arranca importa los productos desde
  `frontend/src/content/catalogo/*.md`. Después el catálogo vive en Strapi y esos `.md` solo
  sirven de respaldo para el frontend.
- **API pública de lectura**: el bootstrap habilita `find` y `findone` del rol público para
  `producto`, así `GET /api/productos` responde 200 sin token. Si prefieres cerrarla, quita esos
  permisos en *Settings → Roles → Public* y pasa `STRAPI_TOKEN` al frontend.
- **Base de datos**: SQLite en `.tmp/data.db` (ignorado por git). El path se resuelve desde el
  directorio de trabajo para no depender de `__dirname` compilado.
- **Puerto**: `PORT` se lee de `.env` (1337). `config/server.ts` ignora un `PORT=0` heredado del
  entorno, que dejaría el servidor en un puerto efímero.

```bash
npm install
npm run develop   # http://localhost:1337 (panel: /admin, crea el primer usuario ahí)
npm run build     # compila a dist/
```

La API de productos queda en `http://localhost:1337/api/productos`.
