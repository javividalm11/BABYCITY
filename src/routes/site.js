import { fail } from '../http/errors.js';
import { renderPage, SPA_ROUTE } from '../seo/render-page.js';
import { renderSitemap } from '../seo/sitemap.js';

// Reviso siempre los archivos de nombre fijo; los subidos tienen nombre único.
const REVALIDATE = /\.(?:html|js|css|json|xml|txt|svg)$/;
const CACHE = {
  revalidate: 'no-cache',
  daily: 'public, max-age=86400',
  immutable: 'public, max-age=31536000, immutable',
};

async function sitemap({ config, repo }) {
  if (!config.siteUrl) throw fail(503, 'Configura SITE_URL para generar el sitemap.');
  const xml = renderSitemap(config.siteUrl, await repo.listProducts());
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

async function storedFile(files, key, cache) {
  const file = await files.get(key);
  if (!file) throw fail(404, 'Archivo no encontrado.');
  return new Response(file.body, {
    headers: { 'Content-Type': file.contentType, 'Cache-Control': cache },
  });
}

const upload = ({ files, params }) => storedFile(files, `uploads/${params.name}`, CACHE.immutable);

// Los PDF llevan espacios y tildes; rechazo cualquier ruta que salga de la carpeta.
function catalogPdf({ files, params }) {
  let name;
  try {
    name = decodeURIComponent(params.name);
  } catch {
    throw fail(404, 'Archivo no encontrado.');
  }
  if (/[\\/]|\.\./.test(name)) throw fail(404, 'Archivo no encontrado.');
  return storedFile(files, `catalogo/${name}`, CACHE.daily);
}

async function page({ assets, repo, config, url }) {
  const route = url.pathname === '/index.html' ? '/' : url.pathname;
  const indexResponse = await assets.fetch(new Request(new URL('/index.html', url)));
  const id = /^\/producto\/(\d+)$/.exec(route)?.[1];
  const product = id && (await repo.getProduct(Number(id)));
  const html = renderPage({
    indexHtml: await indexResponse.text(),
    route,
    product: product?.active ? product : null,
    siteUrl: config.siteUrl,
  });
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' },
  });
}

// Cualquier otra ruta GET la sirvo desde la carpeta pública.
export async function serveAsset({ assets, request, url }) {
  const res = await assets.fetch(request);
  if (res.status === 404) throw fail(404, 'Archivo no encontrado.');
  const out = new Response(res.body, res);
  out.headers.set('Cache-Control', REVALIDATE.test(url.pathname) ? CACHE.revalidate : CACHE.daily);
  return out;
}

export const siteRoutes = [
  { method: 'GET', path: '/sitemap.xml', handler: sitemap },
  {
    method: 'GET',
    path: /^\/assets\/uploads\/(?<name>[a-f0-9]{32}\.(?:png|jpg|webp))$/,
    handler: upload,
  },
  { method: 'GET', path: /^\/catalogo\/(?<name>[^/]+\.pdf)$/, handler: catalogPdf },
  { method: 'GET', path: SPA_ROUTE, handler: page },
  { method: 'GET', path: '/index.html', handler: page },
];
