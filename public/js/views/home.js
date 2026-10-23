import { icon } from '../lib/icons.js';
import { esc } from '../lib/format.js';
import { catalogs } from '../state/store.js';
import { categoryLink } from '../components/layout.js';
import { renderProductShowcase } from './sections/product-showcase.js';
import { renderCommunity } from './sections/community.js';
import { renderShoppingBenefits, renderShoppingChannels } from './sections/shopping-channels.js';

export function home() {
  const categories = [
    [
      'Coches',
      'Pequeñas aventuras, grandes momentos',
      'catalog-01/product-2.webp',
      'catalog-01/product-6.webp',
    ],
    [
      'Cunas y colechos',
      'Dulces sueños desde el primer día',
      'catalog-05/product-26.webp',
      'catalog-05/product-24.webp',
    ],
    [
      'Mecedoras',
      'Momentos de calma para los dos',
      'catalog-06/product-30.webp',
      'catalog-06/product-31.webp',
    ],
    [
      'Sillas de comer',
      'Nuevos sabores, grandes sonrisas',
      'catalog-07/product-36.webp',
      'catalog-07/product-37.webp',
    ],
    [
      'Baño y cuidado',
      'Burbujas, sonrisas y bienestar',
      'catalog-04/product-15.webp',
      'catalog-04/product-17.webp',
    ],
    [
      'Accesorios',
      'Grandes pequeños detalles',
      'catalog-10/product-44.webp',
      'catalog-10/product-42.webp',
    ],
  ];
  const covers = ['catalog-01', 'catalog-05', 'catalog-07']
    .map((id) => catalogs.find((c) => c.id === id))
    .filter(Boolean);
  return `<section class="hero hero-showcase" aria-label="Bienvenida a BabyCity"><div class="hero-room" aria-hidden="true"><img src="/assets/hero/nursery-background.webp" alt="" width="1536" height="1024" fetchpriority="high"></div><svg class="hero-wave" viewBox="0 0 600 600" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0H515C418 110 552 227 535 357C526 448 493 480 432 510C311 562 138 575 0 600Z"/></svg><div class="hero-product-stage" aria-hidden="true">${['catalog-01/product-2.webp', 'catalog-01/product-3.webp', 'catalog-05/product-29.webp', 'catalog-06/product-30.webp', 'catalog-07/product-36.webp'].map((image, index) => `<img class="hero-slide" src="/assets/catalogs/${image}" alt="" width="850" height="850" ${index === 0 ? 'fetchpriority="high"' : 'loading="eager"'} decoding="async">`).join('')}</div><div class="container"><div class="hero-copy"><h1><span>el mundo</span> <span>de tu bebe</span> <em>a un clic</em></h1><p>Todo lo que tu bebé necesita,<br>elegido con amor.</p><div class="hero-actions"><a class="btn primary" href="/tienda" data-link>Explorar productos ${icon('arrow')}</a></div></div></div><button class="hero-pause" data-hero-pause aria-label="Pausar animación" aria-pressed="false"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2v8M8 2v8"/></svg></button></section>
 <section class="section discovery" aria-labelledby="discoveryTitle"><div class="container"><div class="section-heading"><div><span class="eyebrow">Para cada pequeño gran momento</span><h2 id="discoveryTitle">Un mundo<em>por descubrir</em></h2><p>Todo lo que tu bebé necesita, en un solo lugar.<br>Productos seguros, funcionales y llenos de amor.</p></div><p class="discovery-note" aria-hidden="true">Pequeños momentos,<br>grandes historias.<span>♡</span></p><a href="/tienda" data-link class="text-link">Ver todas las categorías ${icon('arrow')}</a></div><div class="category-grid">${categories.map(([name, sub, image, detail], index) => `<a class="category-card" href="${categoryLink(name)}" data-link aria-label="Explorar categoría ${esc(name)}"><span class="category-mobile-icon" aria-hidden="true">${icon(['stroller', 'crib', 'rocker', 'chair', 'bath', 'bag'][index])}</span><div class="category-picture"><img class="category-image-main" src="/assets/catalogs/${image}" alt="${esc(name)}" loading="lazy" width="240" height="255"><img class="category-image-detail" src="/assets/catalogs/${detail}" alt="" aria-hidden="true" loading="lazy" decoding="async" width="240" height="255"></div><div class="category-copy"><h3>${name}</h3><small>${sub}</small></div><span class="category-mobile-arrow" aria-hidden="true">${icon('arrow')}</span></a>`).join('')}</div><a class="discovery-mobile-cta btn primary" href="/tienda" data-link>Explorar todas las categorías ${icon('arrow')}</a></div></section>
 ${renderProductShowcase()}
 ${renderShoppingBenefits()}
 <section class="catalog-feature-section" aria-labelledby="catalogFeatureTitle"><div class="catalog-feature catalog-promo"><div class="catalog-copy"><span class="eyebrow">Inspírate, página a página</span><h2 id="catalogFeatureTitle">Un catálogo lleno<em>de posibilidades.</em></h2><p>Explora nuestras colecciones y encuentra ideas,<br> productos y combinaciones para cada etapa de tu bebé.</p><a class="btn primary catalog-cta" href="/catalogos" data-link>Ver nuestros catálogos ${icon('book')}</a><p class="fine">${catalogs.length} colecciones · Edición 2026 · Disponible en PDF</p><div class="catalog-perks"><div class="catalog-perk"><span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h8l10 10-8 8L3 11V3Z"/><circle cx="7.5" cy="7.5" r="1"/></svg></span><span>Guías por<br>categoría</span></div><div class="catalog-perk"><span>${icon('heart')}</span><span>Inspiración<br>real</span></div><div class="catalog-perk"><span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/></svg></span><span>Descarga<br>rápida</span></div></div></div><div class="catalog-books"><div class="catalog-arch" aria-hidden="true"></div><div class="catalog-plinth" aria-hidden="true"></div><svg class="catalog-cloud" viewBox="0 0 140 80" aria-hidden="true"><path d="M27 69C-1 66 1 36 21 31C18 4 57-2 68 21C84-5 117 6 117 30C144 29 148 66 118 69Z"/></svg><svg class="catalog-cloud catalog-cloud-small" viewBox="0 0 140 80" aria-hidden="true"><path d="M27 69C-1 66 1 36 21 31C18 4 57-2 68 21C84-5 117 6 117 30C144 29 148 66 118 69Z"/></svg><svg class="catalog-star" viewBox="0 0 50 50" aria-hidden="true"><path d="m25 3 7 14 15 3-11 11 2 16-13-7-14 7 3-16L2 20l16-3Z"/></svg><div class="catalog-sphere" aria-hidden="true"></div><div class="catalog-sphere catalog-sphere-mint" aria-hidden="true"></div><div class="catalog-sphere catalog-sphere-cream" aria-hidden="true"></div>${covers.map((c, i) => `<a class="catalog-book catalog-book-${i + 1}" href="/catalogos?libro=${c.id}" data-link aria-label="Leer catálogo ${esc(c.title)}"><img src="${esc(c.pages[0])}" alt="Portada original del catálogo ${esc(c.title)}" loading="lazy" decoding="async" width="685" height="969"></a>`).join('')}</div></div></section>
 ${renderCommunity()}
 ${renderShoppingChannels()}`;
}
