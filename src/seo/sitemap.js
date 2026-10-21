const STATIC_PATHS = [
  '/',
  '/tienda',
  '/catalogos',
  '/nosotros',
  '/contacto',
  '/legal/terminos',
  '/legal/privacidad',
  '/legal/devoluciones',
];

const xmlEscape = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function renderSitemap(siteUrl, products) {
  const paths = [
    ...STATIC_PATHS,
    ...products.filter((p) => p.active).map((p) => `/producto/${p.id}`),
  ];
  const urls = paths.map((p) => `<url><loc>${xmlEscape(siteUrl + p)}</loc></url>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}
