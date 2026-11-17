import type { APIRoute } from 'astro';
import seo from '../data/seo.json';
import { assetUrl } from '../lib/asset-url';

export const GET: APIRoute = ({ site }) =>
  new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${new URL(assetUrl('/sitemap-index.xml'), site ?? seo.site.baseUrl)}\n`,
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    },
  );
