import { esc } from '../lib/format.js';
import { catalogs } from '../state/store.js';
import { intro, cta } from '../components/layout.js';

export function catalogPage() {
  const summary = `<div class="catalog-summary"><span>${catalogs.length} colecciones</span><span>${catalogs.reduce((total, c) => total + c.count, 0)} páginas para explorar</span><span>PDF originales</span></div>`;
  return `${intro('Inspírate, página a página', 'El mundo de tu bebé, en un libro', 'Abre una colección, pasa las páginas y descubre cada detalle. Todos nuestros catálogos originales, en un solo lugar.').replace('</section>', summary + '</section>')}<section class="section"><div class="container catalogs-grid">${catalogs.map((c, index) => `<article class="catalog-card"><button class="catalog-cover" data-book="${c.id}" aria-label="Leer ${esc(c.title)}"><img src="${c.pages[0]}" alt="Portada catálogo ${esc(c.title)}" loading="lazy"></button><span class="catalog-number">COLECCIÓN ${String(index + 1).padStart(2, '0')}</span><h3>${esc(c.title)}</h3><p>Edición 2026 · ${c.count} páginas</p><div class="catalog-links"><button class="btn primary" data-book="${c.id}">Hojear ↗</button><a href="${encodeURI(c.pdf)}" target="_blank" rel="noopener" download>PDF ↓</a></div></article>`).join('')}</div></section>${cta()}`;
}
