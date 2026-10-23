import { esc } from '../lib/format.js';
import { icon } from '../lib/icons.js';
import { catalogs } from '../state/store.js';
import { cta } from '../components/layout.js';

const descriptions = {
  'catalog-01': 'Descubre nuestra línea completa de coches para cada etapa.',
  'catalog-02': 'Versatilidad, comodidad y seguridad para cada momento.',
  'catalog-03': 'Soluciones prácticas para familias múltiples.',
  'catalog-04': 'Todo para acompañar sus rutinas de cuidado.',
  'catalog-05': 'Un espacio acogedor para sus dulces sueños.',
  'catalog-06': 'Momentos de calma y comodidad para tu bebé.',
  'catalog-07': 'Nuevos sabores y momentos para compartir.',
  'catalog-08': 'Comodidad para acompañar sus viajes.',
  'catalog-09': 'Un espacio para jugar y descubrir.',
  'catalog-10': 'Pequeños detalles para su día a día.',
  'catalog-11': 'Acompaña sus primeros descubrimientos.',
  'catalog-12': 'Descubre nuestras combinaciones para tu bebé.',
};

export function catalogPage() {
  return `<div class="collections-page">
    <section class="collections-hero" aria-labelledby="collections-title">
      <div class="collections-heading"><span class="collections-eyebrow">Explora nuestras colecciones</span><h1 id="collections-title">Un catálogo para<br><em>cada aventura</em></h1><p>Descubre nuestros productos, hojea cada colección<br>y encuentra lo mejor para tu bebé.</p></div>
      <img class="collections-art" src="/assets/catalogs/products-3d.webp" alt="" width="1000" height="667" fetchpriority="high">
      <span class="collections-heart" aria-hidden="true">♡</span><span class="collections-note">Todo lo que<br>tu bebé necesita<br>en un solo lugar <b aria-hidden="true">♥</b></span>
      <div class="collections-toolbar"><label class="collections-search">${icon('search')}<input id="catalogSearch" type="search" placeholder="Buscar catálogo…" aria-label="Buscar catálogo"><span aria-hidden="true">${icon('search')}</span></label><div class="collections-filters" role="group" aria-label="Filtrar colecciones">${['Todos', 'Coches', 'Sillas de auto', 'Cunas'].map((label) => `<button type="button" data-collection-filter="${esc(label)}" aria-pressed="${label === 'Todos'}">${label}</button>`).join('')}<label class="collections-more"><span class="sr-only">Más colecciones</span><select id="catalogMore" aria-label="Más colecciones"><option value="">Más</option>${catalogs
        .filter((c) => !['catalog-01', 'catalog-02', 'catalog-05', 'catalog-08'].includes(c.id))
        .map((c) => `<option value="${esc(c.title)}">${esc(c.title)}</option>`)
        .join('')}</select></label></div></div>
    </section>
    <section class="collections-list" aria-label="Catálogos de productos"><div class="catalogs-grid">${catalogs.map((c, index) => `<article class="catalog-card" data-collection-title="${esc(c.title)}"><button class="catalog-cover" data-book="${esc(c.id)}" aria-label="Leer ${esc(c.title)}"><img src="${esc(c.pages[0])}" alt="Portada catálogo ${esc(c.title)}" width="210" height="297" loading="${index < 3 ? 'eager' : 'lazy'}"></button><div class="collection-info"><span class="catalog-number">Colección ${String(index + 1).padStart(2, '0')}</span><h2>${esc(c.title)}</h2><p class="collection-edition">Edición 2026 · ${c.count} páginas</p><p class="collection-description">${esc(descriptions[c.id] || 'Explora todos los detalles de esta colección.')}</p><div class="catalog-links"><button class="collection-read" data-book="${esc(c.id)}">${icon('book')}Ver catálogo ${icon('arrow')}</button><a href="${esc(encodeURI(c.pdf))}" target="_blank" rel="noopener" download><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></svg>Descargar PDF</a></div></div></article>`).join('')}</div><p class="collections-empty" role="status" hidden>No encontramos esa colección. Prueba con otro nombre.</p><p class="sr-only" id="catalogResults" role="status" aria-live="polite"></p></section>
  </div>${cta()}`;
}
