import type { APIRoute } from 'astro';
import { SITE } from '../data/site';
import { RELEASES } from '../data/releases';
import { SESIONES, sesionHref } from '../data/fotos';

/**
 * Every indexable page, built from the same data as the pages themselves, so a
 * new release or photo session lands here without touching this file. The 404
 * is left out on purpose.
 */
const PATHS = [
  '/',
  '/discografia',
  ...RELEASES.map((r) => `/${r.slug}`),
  '/galeria-de-fotos',
  ...SESIONES.map(sesionHref),
  '/aportes',
  '/gracias',
];

export const GET: APIRoute = () =>
  new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${PATHS.map(
      (p) => `  <url><loc>${SITE.origin}${p}</loc></url>`
    ).join('\n')}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
  );
