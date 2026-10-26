import { $ } from '../lib/dom.js';
import { money } from '../lib/format.js';
import { notify } from '../lib/notify.js';
import { cart, products, shipping, favorites, setStoreData, pruneCart } from '../state/store.js';
import { loadStoreData } from '../state/loaders.js';
import { renderCartContent } from '../components/cart-content.js';
import { navigate } from './navigation.js';

export function cartEntries() {
  return cart
    .map((i) => ({ ...i, product: products.find((p) => p.id === i.id) }))
    .filter((i) => i.product);
}
export function totals(delivery = 'pickup') {
  const subtotal =
    Math.round(cartEntries().reduce((s, i) => s + i.quantity * i.product.price, 0) * 100) / 100;
  const fee = delivery === 'pickup' ? 0 : shipping[delivery];
  return { subtotal, fee, total: fee === null ? null : Math.round((subtotal + fee) * 100) / 100 };
}
export function totalMarkup(delivery = 'pickup') {
  const t = totals(delivery);
  return `<div class="cart-totals"><p><span>Subtotal</span><b>${money(t.subtotal)}</b></p><p><span>${delivery === 'pickup' ? 'Recojo en tienda' : 'Envío'}</span><b>${t.fee === null ? 'Por cotizar' : t.fee === 0 ? 'Sin costo' : money(t.fee)}</b></p><p class="total"><span>${t.total === null ? 'Subtotal sin envío' : 'Total'}</span><b>${money(t.total ?? t.subtotal)}</b></p>${t.total === null ? '<p class="fine">El total final se confirma al cotizar el envío.</p>' : ''}</div>`;
}
export function renderCart() {
  $('#cartContent').innerHTML = renderCartContent({
    entries: cartEntries(),
    count: cart.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: totals().subtotal,
    favorites,
  });
}
export async function openCart() {
  try {
    setStoreData(await loadStoreData());
  } catch {
    notify('No pudimos actualizar la disponibilidad. Intenta nuevamente.');
    return;
  }
  pruneCart();
  renderCart();
  $('#cartDialog').showModal();
}
export function checkout() {
  if (!cartEntries().length) return;
  if (location.pathname === '/compra' && $('#checkoutForm')) {
    $('#cartDialog').close();
    return;
  }
  return navigate('/compra');
}
