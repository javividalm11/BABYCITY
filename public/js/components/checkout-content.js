import { esc } from '../lib/format.js';
import { icon } from '../lib/icons.js';

const fieldIcon = (symbol) => {
  const paths = {
    phone: 'M5 3H2v4c0 8 7 15 15 15h4v-4l-5-2-2 3c-4-2-7-5-9-9l3-2-3-5Z',
    mail: 'M3 5h18v14H3V5Zm0 0 9 8 9-8',
    message: 'M3 3h18v15H8l-5 4V3Zm4 5h10M7 12h7',
  };
  const svg = paths[symbol]
    ? `<svg viewBox="0 0 24 24"><path d="${paths[symbol]}"/></svg>`
    : icon(symbol);
  return `<i class="checkout-field-icon" aria-hidden="true">${svg}</i>`;
};
export const checkoutFooter = () =>
  `<div class="checkout-footer"><div>${icon('shield')}<span>Compra<br>segura</span></div><div>${icon('truck')}<span>Envíos a<br>todo el Perú</span></div><button type="button" data-action="contact">${icon('chat')}<span>Ayuda por<br>WhatsApp</span></button></div>`;

export function renderCheckout(shipping, totalMarkup) {
  return `<div class="checkout-head"><div class="checkout-navigation"><button type="button" data-action="back-cart">← Volver al carrito</button><span class="checkout-step">Paso 2 de 2</span></div><h2>Un paso <em>más cerca.</em></h2><p class="fine">Registra tus datos para coordinar tu pedido.</p></div>
  <form id="checkoutForm"><div class="checkout-fields">
    <label>Tu nombre completo<span class="checkout-input">${fieldIcon('user')}<input name="name" required minlength="2" autocomplete="name" maxlength="120" placeholder="Ej. María Pérez García"></span></label>
    <label>Celular<span class="checkout-input">${fieldIcon('phone')}<input name="phone" type="tel" required pattern="[+0-9\\s\\-]{9,18}" autocomplete="tel" placeholder="Ej. 987 654 321"></span></label>
    <label>Correo (opcional)<span class="checkout-input">${fieldIcon('mail')}<input name="email" type="email" autocomplete="email" maxlength="160" placeholder="Ej. maria@correo.com"></span></label>
    <label>¿Cómo prefieres recibirlo?<span class="checkout-input">${fieldIcon('store')}<select name="delivery" id="deliverySelect"><option value="pickup">Recojo en La Victoria · Sin costo</option><option value="lima">Envío a Lima${shipping.lima}</option><option value="province">Envío a provincias${shipping.province}</option></select></span></label>
    <label id="addressLabel" hidden>Dirección, distrito y ciudad<span class="checkout-input">${fieldIcon('store')}<textarea name="address" autocomplete="street-address" maxlength="300" rows="2" placeholder="Dirección y referencias para la entrega"></textarea></span></label>
    <label>Indicaciones (opcional)<span class="checkout-input">${fieldIcon('message')}<textarea name="notes" maxlength="700" rows="2" placeholder="Ej. Horario de recojo, referencias, etc."></textarea></span></label>
  </div><div id="checkoutTotals">${totalMarkup}</div><label class="check"><input name="consent" type="checkbox" required><span>He leído los <a href="/legal/terminos" data-link>términos</a> y autorizo el uso de mis datos para gestionar mi solicitud según la <a href="/legal/privacidad" data-link>política de privacidad</a>.</span></label><button type="submit" class="btn primary">Registrar mi solicitud ${icon('arrow')}</button><p class="fine checkout-disclaimer">Este paso no realiza un cobro ni reserva inventario.</p><p class="form-status" role="status"></p></form>${checkoutFooter()}`;
}

export function renderOrderSuccess(order, link) {
  return `<button class="close checkout-success-close" data-close aria-label="Cerrar confirmación">×</button><div class="success checkout-success"><span class="checkout-step">Solicitud registrada</span><span class="checkout-success-icon">${icon('check')}</span><h2>Ya tenemos <em>tu solicitud.</em></h2><p>Gracias por confiar en BabyCity. Estamos un paso más cerca de acompañarte.</p><div class="checkout-confirmation"><span>Tu código de solicitud</span><strong>${esc(order.id)}</strong><p>Envíala por WhatsApp para confirmar la disponibilidad, la entrega y el pago con nuestro equipo.</p></div><a class="btn primary" href="${esc(link)}" target="_blank" rel="noopener noreferrer">${icon('chat')}Enviar mi pedido por WhatsApp</a><button class="btn cart-continue" data-close>Seguir explorando</button><p class="fine checkout-disclaimer">No se ha realizado un cobro. Tu solicitud está guardada para que nuestro equipo pueda atenderte.</p></div>${checkoutFooter()}`;
}
