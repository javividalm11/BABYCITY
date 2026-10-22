import { icon } from '../lib/icons.js';
import { intro } from '../components/layout.js';

export function contact() {
  return `${intro('De mamá a mamá', 'Estamos cerquita de ti', 'Por WhatsApp, en nuestros lives o en tienda física. Elige cómo prefieres conversar.')}<section class="section"><div class="container info-grid"><div class="info-card"><span class="eyebrow">Visítanos en La Victoria</span><h2>Conoce su próximo<br>favorito en persona.</h2><p>Jr. Antonio Raymondi 512<br>La Victoria, Lima, Perú</p><p><a href="tel:+51937473120">+51 937 473 120</a><br>Coordina el horario de tu visita con nuestro equipo.</p><button class="btn primary" data-action="contact">Coordinar mi visita ${icon('chat')}</button><p class="fine">GRUPO BABY STORE S.A.C. · RUC 20614491036</p></div><a class="map-link" href="https://www.google.com/maps/search/?api=1&query=Jr.+Antonio+Raymondi+512+La+Victoria+Lima+Peru" target="_blank" rel="noopener"><div class="map-pin">${icon('store')}<b>Tu próxima visita, aquí.</b><small>Jr. Antonio Raymondi 512<br>La Victoria, Lima</small><span class="text-link">Abrir en Google Maps ↗</span></div></a></div></section><section class="section soft"><div class="container faq"><span class="eyebrow">Te ayudamos a comprar</span><h2>Resolvamos tus dudas</h2>${[
    [
      '¿Cómo hago mi pedido?',
      'Elige tus productos, agrégalos al carrito y completa tus datos de entrega. Guardaremos tu solicitud y podrás enviarla a nuestro equipo por WhatsApp. Te confirmamos disponibilidad, tarifa y pago antes de cerrar la compra.',
    ],
    [
      '¿Hacen envíos a provincias?',
      'Sí, coordinamos envíos a todo el Perú. La cobertura, tarifa, agencia y plazo se confirman según tu destino antes de realizar el pago.',
    ],
    [
      '¿Puedo recoger mi pedido en tienda?',
      'Sí. Selecciona recojo en tienda en el carrito y coordina la fecha y horario por WhatsApp. El recojo no tiene costo de envío.',
    ],
    [
      '¿Cómo puedo pagar?',
      'Nuestro equipo te informará los medios habilitados al confirmar tu pedido. La web no solicita datos de tarjetas ni realiza cobros en línea por el momento.',
    ],
    [
      '¿Dónde veo los productos en vivo?',
      'Encuéntranos en TikTok como @babycityperu. Allí podrás conocer los productos, hacer preguntas y recibir asesoría.',
    ],
  ]
    .map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`)
    .join('')}</div></section>`;
}
