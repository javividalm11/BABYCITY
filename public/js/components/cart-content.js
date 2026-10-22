import { esc, money } from '../lib/format.js';
import { icon } from '../lib/icons.js';

function renderItem({ product: p, quantity }, favorites) {
  const saved = favorites.includes(p.id);
  const availability =
    p.stock === null ? 'Disponibilidad por confirmar' : p.stock === 0 ? 'Agotado' : 'Disponible';
  return `<article class="cart-item">
    <div class="cart-product-row"><div class="cart-product-image"><img src="${esc(p.image)}" alt="${esc(p.name)}"></div>
      <div class="cart-product-details"><h3>${esc(p.name)}</h3><small>${availability}</small><strong class="cart-unit-price">${money(p.price)}</strong>
        <div class="cart-product-controls"><div class="quantity"><button data-quantity="${p.id}" data-delta="-1" aria-label="Reducir cantidad de ${esc(p.name)}">−</button><span aria-label="Cantidad">${quantity}</span><button data-quantity="${p.id}" data-delta="1" aria-label="Aumentar cantidad de ${esc(p.name)}">+</button></div><button class="remove" data-remove="${p.id}" aria-label="Quitar ${esc(p.name)} del carrito">Quitar</button></div>
      </div><button class="wish cart-wish${saved ? ' saved' : ''}" data-wish="${p.id}" aria-pressed="${saved}" aria-label="${saved ? 'Quitar de favoritos' : 'Guardar en favoritos'}">${icon('heart')}</button>
    </div>
  </article>`;
}

export function renderCartContent({ entries, count, subtotal, favorites }) {
  return `<button class="close" data-close aria-label="Cerrar carrito">×</button>
    <div class="cart-heading"><span class="eyebrow">Pequeñas elecciones, mucho amor</span><h2>Tu carrito <small>(${count})</small></h2><p>Gracias por confiar en BabyCity. Estás a un paso de<br class="cart-desktop-break"> hacer feliz a tu bebé.</p><span class="cart-hearts" aria-hidden="true">♡<small>♥</small></span></div>
    ${
      entries.length
        ? `<div class="cart-items">${entries.map((entry) => renderItem(entry, favorites)).join('')}</div>
      <div class="cart-summary"><div class="cart-totals"><p><span>Subtotal</span><b>${money(subtotal)}</b></p><p><span>${icon('store')}Recojo en tienda</span><b>Sin costo</b></p><p class="cart-shipping"><span>${icon('truck')}Envío</span><span>Se calcula en el siguiente paso</span></p><p class="total"><span>Total</span><b>${money(subtotal)}</b></p></div>
      <p class="cart-availability">${icon('box')}<span>La disponibilidad de los productos y el costo de envío<br class="cart-desktop-break"> se confirmarán antes del pago.</span></p></div>
      <div class="cart-actions"><button class="btn primary" data-action="checkout">Continuar con mi pedido ${icon('arrow')}</button><button class="btn cart-continue" data-close>Seguir comprando</button></div>`
        : `<div class="cart-empty">${icon('bag')}<h3>Hay un mundo por descubrir</h3><p>Agrega algo especial para tu bebé y lo encontrarás aquí.</p><button class="btn primary" data-close>Seguir comprando ${icon('arrow')}</button></div>`
    }
    <div class="cart-footer"><div>${icon('bag')}<span><b>Compra segura</b><small>Tus datos están protegidos</small></span></div><div>${icon('truck')}<span><b>Envíos a todo el Perú</b><small>Hasta donde está tu familia</small></span></div><button data-action="contact">${icon('chat')}<span><b>¿Necesitas ayuda?</b><small>Escríbenos por WhatsApp</small></span></button></div>`;
}
