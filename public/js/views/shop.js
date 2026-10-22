import { esc } from '../lib/format.js';
import { products, favorites, shopPage, setShopPage } from '../state/store.js';
import { intro, empty } from '../components/layout.js';
import { productCard } from '../components/product-card.js';

export function shop(saved = false) {
  const params = new URLSearchParams(location.search),
    q = params.get('q') || '',
    cat = params.get('categoria') || 'Todos',
    sort = params.get('orden') || 'recommended';
  const list = products.filter(
    (p) =>
      (!saved || favorites.includes(p.id)) &&
      (cat === 'Todos' || p.category === cat) &&
      p.name.toLocaleLowerCase().includes(q.toLocaleLowerCase()),
  );
  if (sort === 'asc') list.sort((a, b) => a.price - b.price);
  if (sort === 'desc') list.sort((a, b) => b.price - a.price);
  if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
  const pages = Math.ceil(list.length / 12);
  setShopPage(Math.max(1, Math.min(shopPage, pages || 1)));
  return `${intro(saved ? 'Tus pequeños flechazos' : 'Hecho para acompañar su crecimiento', saved ? 'Guardados con amor' : 'Encuentra su próximo favorito', saved ? 'Tus favoritos se guardan en este dispositivo para cuando quieras volver.' : 'Coches, cunas y pequeños esenciales. Explora nuestra selección y déjanos ayudarte a elegir.')}<section class="section"><div class="container shop-layout"><aside class="shop-aside"><h3>Explora la tienda</h3><form id="shopSearch"><label>Buscar productos<input type="search" name="q" value="${esc(q)}" placeholder="¿Qué estás buscando?"></label></form><div class="filter-list" aria-label="Categorías">${['Todos', ...new Set(products.map((p) => p.category))].map((c) => `<button data-category="${esc(c)}" class="${cat === c ? 'active' : ''}" aria-pressed="${cat === c}">${esc(c)}</button>`).join('')}</div><p class="fine">Precios en soles (PEN), publicados en los catálogos. Confirmamos la disponibilidad y entrega antes del pago.</p></aside><div><div class="shop-toolbar"><p>${list.length} productos ${cat !== 'Todos' ? 'en ' + esc(cat) : ''}</p><label class="sort-label"><span class="fine">Ordenar por</span><select id="shopSort" aria-label="Ordenar productos">${[
    ['recommended', 'Selección BabyCity'],
    ['asc', 'Menor precio'],
    ['desc', 'Mayor precio'],
    ['name', 'Nombre A–Z'],
  ]
    .map(([v, t]) => `<option value="${v}" ${sort === v ? 'selected' : ''}>${t}</option>`)
    .join('')}</select></label></div><div class="products-grid">${
    list.length
      ? list
          .slice((shopPage - 1) * 12, shopPage * 12)
          .map(productCard)
          .join('')
      : empty(
          saved ? 'Tu lista comienza con un flechazo' : 'No encontramos coincidencias',
          saved
            ? 'Toca el corazón de los productos que te gusten para tenerlos siempre a mano.'
            : 'Prueba otro nombre o explora una categoría diferente.',
        )
  }</div>${pages > 1 ? `<nav class="pagination" aria-label="Páginas de productos">${Array.from({ length: pages }, (_, i) => `<button data-page="${i + 1}" class="${i + 1 === shopPage ? 'active' : ''}" ${i + 1 === shopPage ? 'aria-current="page"' : ''}>${i + 1}</button>`).join('')}</nav>` : ''}</div></div></section>`;
}
