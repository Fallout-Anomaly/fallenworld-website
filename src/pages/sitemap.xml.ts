import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = true;

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export const GET: APIRoute = async () => {
  const docs = await getCollection('docs');
  const site = new URL(import.meta.env.SITE || 'https://fallenworld.nexus');
  const paths = [
    '/',
    '/apply',
    '/community',
    '/features',
    '/knox-aftermath',
    '/knox-start',
    '/knox-rules',
    '/knox-world',
    '/knox-roadmap',
    '/knox-changelog',
    '/privacy',
    ...docs.map((entry) => `/docs/${entry.id.replace(/\.(md|mdx)$/, '')}`),
  ];

  const urls = [...new Set(paths)]
    .sort()
    .map((pathname) => `  <url><loc>${escapeXml(new URL(pathname, site).href)}</loc></url>`)
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
