import { icon } from '../lib/icons.js';
import { esc, money } from '../lib/format.js';
import { favorites } from '../state/store.js';

export function productCard(p) {
  return `<article class="product-card reveal"><button class="wish ${favorites.includes(p.id) ? 'saved' : ''}" data-wish="${p.id}" aria-label="${favorites.includes(p.id) ? 'Quitar de' : 'Guardar en'} favoritos" aria-pressed="${favorites.includes(p.id)}">${icon('heart')}</button><a href="/producto/${p.id}" data-link class="product-picture"><span class="product-label">${esc(p.category)}</span><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" width="260" height="256"></a><div class="product-info"><small>Selección BabyCity</small><a href="/producto/${p.id}" data-link><h3>${esc(p.name)}</h3></a><p>${p.stock === null ? 'Disponibilidad por confirmar' : p.stock === 0 ? 'Agotado' : `${p.stock} ${p.stock === 1 ? 'unidad disponible' : 'unidades disponibles'}`}</p><div class="price-line"><strong>${money(p.price)}</strong><button class="add" data-add="${p.id}" aria-label="Agregar ${esc(p.name)}" ${p.stock === 0 ? 'disabled' : ''}>+</button></div></div></article>`;
}
