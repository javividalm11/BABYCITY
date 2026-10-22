import { $ } from '../lib/dom.js';
import { money } from '../lib/format.js';
import { notify } from '../lib/notify.js';
import { cart, products, shipping, favorites, setStoreData, pruneCart } from '../state/store.js';
import { loadStoreData } from '../state/loaders.js';
import { renderCartContent } from '../components/cart-content.js';

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
function totalMarkup(delivery = 'pickup') {
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
  $('#cartContent').innerHTML =
    `<div class="checkout-head"><button data-action="back-cart">← Volver al carrito</button><h2>Un paso más cerca.</h2><p class="fine">Registra tu solicitud y coordina los detalles con nuestro equipo.</p></div><form id="checkoutForm"><label>Tu nombre completo<input name="name" required minlength="2" autocomplete="name" maxlength="120"></label><label>Celular<input name="phone" type="tel" required pattern="[+0-9\\s\\-]{9,18}" autocomplete="tel"></label><label>Correo (opcional)<input name="email" type="email" autocomplete="email" maxlength="160"></label><label>¿Cómo prefieres recibirlo?<select name="delivery" id="deliverySelect"><option value="pickup">Recojo en La Victoria · Sin costo</option><option value="lima">Envío a Lima${shipping.lima === null ? ' · Por cotizar' : ' · ' + money(shipping.lima)}</option><option value="province">Envío a provincias${shipping.province === null ? ' · Por cotizar' : ' · ' + money(shipping.province)}</option></select></label><label id="addressLabel" hidden>Dirección, distrito y ciudad<textarea name="address" autocomplete="street-address" maxlength="300" rows="2"></textarea></label><label>Indicaciones (opcional)<textarea name="notes" maxlength="700" rows="2"></textarea></label><div id="checkoutTotals">${totalMarkup()}</div><label class="check"><input name="consent" type="checkbox" required>He leído los <a href="/legal/terminos" data-link>términos</a> y autorizo el uso de mis datos para gestionar mi solicitud según la <a href="/legal/privacidad" data-link>política de privacidad</a>.</label><button class="btn primary">Registrar mi solicitud →</button><p class="fine">Este paso no realiza un cobro ni reserva inventario.</p><p class="form-status" role="status"></p></form>`;
  $('#deliverySelect').onchange = (e) => {
    const needed = e.target.value !== 'pickup';
    $('#addressLabel').hidden = !needed;
    $('#addressLabel textarea').required = needed;
    $('#checkoutTotals').innerHTML = totalMarkup(e.target.value);
  };
}
