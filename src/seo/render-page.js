import { BUSINESS } from '../constants.js';

const PAGE_TITLES = {
  '/tienda': 'Tienda',
  '/catalogos': 'Catálogos interactivos',
  '/contacto': 'Contacto y tienda física',
  '/nosotros': 'Nosotros',
  '/legal/terminos': 'Términos y condiciones',
  '/legal/privacidad': 'Política de privacidad',
  '/legal/devoluciones': 'Cambios y devoluciones',
  '/reclamaciones': 'Libro de Reclamaciones',
  '/admin': 'Administración',
  '/favoritos': 'Mis favoritos',
};
const NO_INDEX = new Set(['/admin', '/favoritos']);
const LOADING = '<div class="loading">Preparando un mundo de pequeños descubrimientos…</div>';

export const SPA_ROUTE =
  /^\/(?:tienda|catalogos|nosotros|contacto|favoritos|admin|reclamaciones|producto\/\d+|legal\/(?:terminos|privacidad|devoluciones))?\/?$/;

export const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

function storeSchema(origin) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: BUSINESS.name,
    legalName: BUSINESS.legalName,
    taxID: BUSINESS.taxId,
    telephone: BUSINESS.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS.street,
      addressLocality: BUSINESS.locality,
      addressRegion: BUSINESS.region,
      addressCountry: BUSINESS.country,
    },
    sameAs: BUSINESS.profiles,
    ...(origin ? { url: origin } : {}),
  };
}

function availability(stock) {
  if (stock === null) return {};
  return { availability: `https://schema.org/${stock > 0 ? 'InStock' : 'OutOfStock'}` };
}

function productSchema(product, origin, route) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    description: product.description,
    ...(origin ? { image: origin + product.image } : {}),
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'PEN',
      ...(origin ? { url: origin + route } : {}),
      ...availability(product.stock),
    },
  };
}

function productFallback(product) {
  const stock =
    product.stock === null
      ? 'Disponibilidad por confirmar'
      : product.stock === 0
        ? 'Agotado'
        : 'Disponible';
  return `<article class="container section"><h1>${escapeHtml(product.name)}</h1><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" width="300"><p>${escapeHtml(product.description)}</p><p>S/ ${product.price.toFixed(2)} · ${stock}</p><a href="https://wa.me/51937473120">Consultar por WhatsApp</a></article>`;
}

// Completo el documento base con título, descripción y datos estructurados de la ruta.
export function renderPage({ indexHtml, route, product, siteUrl }) {
  let html = indexHtml;
  const title = product ? product.name : PAGE_TITLES[route];
  if (title)
    html = html.replace(
      /<title>.*?<\/title>/,
      `<title>${escapeHtml(title)} · BabyCity Perú</title>`,
    );
  if (product) {
    const summary = escapeHtml(
      `${product.name} en BabyCity Perú. ${product.description.slice(0, 140)}`,
    );
    html = html
      .replace(
        /<meta name="description" content="[^"]*">/,
        `<meta name="description" content="${summary}">`,
      )
      .replace(LOADING, productFallback(product));
  }
  const schema = product ? productSchema(product, siteUrl, route) : storeSchema(siteUrl);
  const ogTitle = escapeHtml(`${title || 'El mundo de tu bebé, a un clic'} · BabyCity Perú`);
  const canonical = siteUrl
    ? `<link rel="canonical" href="${escapeHtml(siteUrl + route)}"><meta property="og:url" content="${escapeHtml(siteUrl + route)}">`
    : '';
  const robots = NO_INDEX.has(route) ? '<meta name="robots" content="noindex,nofollow">' : '';
  const head =
    `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>` +
    `${canonical}<meta property="og:title" content="${ogTitle}"><meta property="og:type" content="website">${robots}`;
  return html.replace('</head>', `${head}</head>`);
}
