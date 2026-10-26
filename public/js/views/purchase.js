import { renderCheckout } from '../components/checkout-content.js';
import { cartEntries, totalMarkup } from '../features/cart.js';
import { shipping, pruneCart } from '../state/store.js';
import { esc, money } from '../lib/format.js';
import { $ } from '../lib/dom.js';

let changes;

function purchaseItems() {
  return cartEntries()
    .map(
      ({ product, quantity }) =>
        `<article class="purchase-item"><img src="${esc(product.image)}" alt="${esc(product.name)}" width="64" height="64"><div><strong>${esc(product.name)}</strong><span>${quantity} × ${money(product.price)}</span></div><b>${money(quantity * product.price)}</b></article>`,
    )
    .join('');
}

export function purchase() {
  pruneCart();
  if (!cartEntries().length)
    return `<section class="purchase-page purchase-empty"><span class="eyebrow">Tu compra en BabyCity</span><h1>Tu carrito está vacío</h1><p>Elige algo especial para tu bebé y vuelve para coordinar tu compra.</p><a class="btn primary" href="/tienda" data-link>Explorar la tienda</a></section>`;
  return `<section class="purchase-page" aria-label="Compra en BabyCity"><div id="purchaseContent">${renderCheckout({ lima: shipping.lima === null ? ' · Por cotizar' : ' · ' + money(shipping.lima), province: shipping.province === null ? ' · Por cotizar' : ' · ' + money(shipping.province) }, totalMarkup(), purchaseItems())}</div></section>`;
}

export function destroyPurchase() {
  changes?.abort();
}

export function mountPurchase() {
  const form = $('#checkoutForm');
  if (!form) return;
  form.addEventListener('change', (event) => {
    if (event.target.name === 'delivery') {
      const needed = event.target.value !== 'pickup';
      $('#addressLabel').hidden = !needed;
      form.elements.address.required = needed;
      $('#checkoutTotals').innerHTML = totalMarkup(event.target.value);
    }
    if (!['paymentMethod', 'receiptChannel'].includes(event.target.name)) return;
    const enabled = form.elements.paymentMethod.value !== 'coordinate';
    $('#receiptDelivery').hidden = !enabled;
    form.querySelectorAll('[name=receiptChannel]').forEach((radio) => {
      radio.disabled = !enabled;
    });
    const upload = enabled && form.elements.receiptChannel.value === 'upload';
    $('#receiptUpload').hidden = !upload;
    form.elements.receipt.disabled = !upload;
    form.elements.receipt.required = upload;
    if (!upload) form.elements.receipt.value = '';
  });
  changes = new AbortController();
  document.addEventListener(
    'bc-cart-change',
    () => {
      if (!form.isConnected) return;
      $('#purchaseItems').innerHTML =
        purchaseItems() || '<p>Tu carrito está vacío. Agrega productos para continuar.</p>';
      $('#checkoutTotals').innerHTML = totalMarkup(form.elements.delivery.value);
      form.querySelector('[type=submit]').disabled = !cartEntries().length;
    },
    { signal: changes.signal },
  );
}
