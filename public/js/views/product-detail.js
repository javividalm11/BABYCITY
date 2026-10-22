import { icon } from '../lib/icons.js';
import { esc, money } from '../lib/format.js';
import { products, catalogs, favorites } from '../state/store.js';
import { empty, categoryLink } from '../components/layout.js';
import { productCard } from '../components/product-card.js';

export function detail(id) {
  const p = products.find((p) => p.id === id);
  if (!p)
    return empty(
      'No encontramos este producto',
      'Puedes descubrir otras opciones en nuestra tienda.',
    );
  const c = catalogs.find((c) => c.id === p.catalogId);
  return `<section class="section"><div class="container"><nav class="breadcrumbs" aria-label="Ruta"><a href="/" data-link>Inicio</a> / <a href="/tienda" data-link>Tienda</a> / ${esc(p.name)}</nav><div class="detail-grid"><div class="detail-image"><img src="${esc(p.image)}" alt="${esc(p.name)}"></div><div class="detail-copy"><span class="eyebrow">${esc(p.category)}</span><h1>${esc(p.name)}</h1><span class="availability">${p.stock === null ? 'Disponibilidad por confirmar' : p.stock === 0 ? 'Agotado' : `${p.stock} unidades disponibles`}</span><div class="price">${money(p.price)}</div><p>Un nuevo detalle para su pequeño mundo. Conoce el modelo en nuestro catálogo y recibe asesoría personalizada antes de elegir.</p><div class="detail-actions"><button class="btn primary" data-add="${p.id}" ${p.stock === 0 ? 'disabled' : ''}>Agregar al carrito ${icon('bag')}</button><button class="btn secondary" data-wish="${p.id}" aria-pressed="${favorites.includes(p.id)}">${icon('heart')} ${favorites.includes(p.id) ? 'Guardado' : 'Guardar'}</button></div><p class="fine">Precio del catálogo en soles. El pedido es una solicitud: nuestro equipo confirma disponibilidad, variantes y envío antes de coordinar el pago.</p><details open><summary>Detalles del catálogo</summary><p>${esc(p.description)}</p>${c ? `<button class="btn secondary" data-book="${c.id}" data-book-page="${p.sourcePage}">Ver página ${p.sourcePage} del catálogo ↗</button>` : ''}</details><details><summary>Envíos y recojo en tienda</summary><p>Recojo en Jr. Antonio Raymondi 512, La Victoria, sin costo de envío. Para Lima y provincias, coordinamos cobertura, tarifa y plazo por WhatsApp.</p></details><details><summary>Cambios y atención después de tu compra</summary><p>Conserva tu comprobante y contáctanos para revisar tu caso. <a href="/legal/devoluciones" data-link class="text-link">Consulta nuestra política</a>.</p></details><p class="fine">Código ${esc(p.sku)}${c ? ` · Fuente: ${esc(c.title)}, página ${p.sourcePage}` : ''}</p></div></div></div></section><section class="section soft"><div class="container"><div class="section-heading"><h2>Más por descubrir</h2><a href="${categoryLink(p.category)}" data-link class="text-link">Ver categoría ↗</a></div><div class="products-grid">${products
    .filter((x) => x.id !== p.id && x.category === p.category)
    .slice(0, 4)
    .map(productCard)
    .join('')}</div></div></section>`;
}
