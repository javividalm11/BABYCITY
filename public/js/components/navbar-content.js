import { icon } from '../lib/icons.js';
import { esc } from '../lib/format.js';
import { categoryLink } from './layout.js';

const categories = [
  { name: 'Coches', icon: 'stroller', image: 'catalog-01/product-2.webp', copy: 'Pequeñas aventuras' },
  { name: 'Cunas y colechos', icon: 'crib', image: 'catalog-05/product-29.webp', copy: 'Dulces sueños' },
  { name: 'Mecedoras', icon: 'rocker', image: 'catalog-06/product-30.webp', copy: 'Momentos de calma' },
  { name: 'Sillas de comer', icon: 'chair', image: 'catalog-07/product-36.webp', copy: 'Nuevos sabores' },
  { name: 'Baño y cuidado', icon: 'bath' },
  { name: 'Accesorios', icon: 'bag' },
];
const extras = [
  ['Melliceros', 'stroller'],
  ['Sillas de auto', 'shield'],
  ['Andadores', 'rocker'],
  ['Cercos de juego', 'crib'],
  ['Combos', 'box'],
];

function categoryRow(category) {
  return `<a href="${esc(categoryLink(category.name))}" data-link>${icon(category.icon)}<span>${esc(category.name)}</span>${icon('chevron')}</a>`;
}

export function renderMegaMenu() {
  return `<nav class="mega-sidebar" aria-label="Categorías de la tienda">
    <a class="mega-all" href="/tienda" data-link>${icon('grid')}<span>Todos los productos</span></a>
    ${categories.map(categoryRow).join('')}
  </nav>
  <div class="mega-discovery"><p class="mega-eyebrow">Categorías destacadas</p>
    <div class="mega-cards">${categories.slice(0, 4).map((category) => `<a class="mega-card" href="${esc(categoryLink(category.name))}" data-link>
      <div class="mega-card-image"><img src="/assets/catalogs/${esc(category.image)}" alt="${esc(category.name)} de BabyCity" width="180" height="150" loading="lazy"></div>
      <div class="mega-card-copy"><div><strong>${esc(category.name)}</strong><small>${esc(category.copy)}</small></div><span class="mega-card-arrow">${icon('arrow')}</span></div>
    </a>`).join('')}</div>
    <div class="mega-more-heading"><p class="mega-eyebrow">También puedes explorar</p><span></span></div>
    <nav class="mega-extras" aria-label="Más categorías">${extras.map(([name, symbol]) => `<a href="${esc(categoryLink(name))}" data-link><span>${icon(symbol)}</span>${esc(name)}</a>`).join('')}</nav>
  </div>
  <a class="mega-promo" href="/tienda" data-link>
    <span class="mega-promo-label">Todo para su bienestar</span><strong>Equipamos<br>cada etapa<br>de su <em>historia</em></strong>
    <span class="mega-promo-button">Ver todos los productos ${icon('arrow')}</span>
    <img src="/assets/catalogs/catalog-07/product-36.webp" alt="Silla de comer del catálogo BabyCity" width="330" height="330" loading="lazy">
  </a>`;
}

export function renderMobileMenu() {
  return `<nav class="mobile-primary-links" aria-label="Principal móvil"><a href="/" data-link>Inicio</a><a href="/catalogos" data-link>Catálogos</a><a href="/nosotros" data-link>Nosotros</a><a href="/contacto" data-link>Visítanos</a></nav>
    <p class="mega-eyebrow">Encuentra su próximo favorito</p><nav class="mobile-category-links" aria-label="Categorías móvil"><a class="mega-all" href="/tienda" data-link>${icon('grid')}<span>Todos los productos</span></a>${categories.map(categoryRow).join('')}${extras.map(([name, symbol]) => categoryRow({name, icon: symbol})).join('')}</nav>
    <button class="mobile-contact-button" type="button" data-action="contact">${icon('chat')}Conversemos por WhatsApp</button>`;
}
