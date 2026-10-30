import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '0.0.0.0'),
  // Algunos entornos exportan PORT=0; sin el fallback el servidor quedaría
  // escuchando en un puerto efímero impredecible.
  port: env.int('PORT', 1337) || 1337,
  app: {
    keys: env.array('APP_KEYS')!,
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});

export default config;
