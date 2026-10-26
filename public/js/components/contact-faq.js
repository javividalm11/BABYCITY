import { icon } from '../lib/icons.js';

const card =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/></svg>';
const live =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4m8.4-8.4a6 6 0 0 1 0 8.4M4.5 4.5a10.6 10.6 0 0 0 0 15m15-15a10.6 10.6 0 0 1 0 15"/></svg>';

const questions = [
  {
    symbol: icon('cart'),
    question: '¿Cómo hago mi pedido?',
    answer:
      'Elige tus productos, agrégalos al carrito y completa tus datos de entrega. Guardaremos tu solicitud y podrás enviarla a nuestro equipo por WhatsApp. Te confirmamos disponibilidad, tarifa y pago antes de cerrar la compra.',
  },
  {
    symbol: icon('truck'),
    question: '¿Hacen envíos a provincias?',
    answer:
      'Sí, coordinamos envíos a todo el Perú. La cobertura, tarifa, agencia y plazo se confirman según tu destino antes de realizar el pago.',
  },
  {
    symbol: icon('store'),
    question: '¿Puedo recoger mi pedido en tienda?',
    answer:
      'Sí. Selecciona recojo en tienda en el carrito y coordina la fecha y horario por WhatsApp. El recojo no tiene costo de envío. Te esperamos en Jr. Antonio Raymondi 512, La Victoria, Lima.',
  },
  {
    symbol: card,
    question: '¿Cómo puedo pagar?',
    answer:
      'Nuestro equipo te informará los medios habilitados al confirmar tu pedido. La web no solicita datos de tarjetas ni realiza cobros en línea por el momento.',
  },
  {
    symbol: live,
    question: '¿Dónde veo los productos en vivo?',
    answer:
      'Encuéntranos en <a href="https://www.tiktok.com/@babycityperu" target="_blank" rel="noopener noreferrer">TikTok como @babycityperu ↗</a>. Allí podrás conocer los productos, hacer preguntas y recibir asesoría.',
  },
];

const benefits = [
  ['truck', 'Envíos a todo el Perú', 'Llevamos felicidad a cada familia'],
  ['heart', 'Atención cercana', 'Te asesoramos en cada etapa'],
  ['shield', 'Compra con confianza', 'Atención antes y después'],
  ['store', 'Visítanos en tienda', 'La Victoria, Lima'],
];

export function renderContactFaq() {
  return `<section class="contact-faq" aria-labelledby="contact-faq-title">
    <div class="faq-copy"><span class="eyebrow">Preguntas frecuentes</span><h2 id="contact-faq-title">Resolvemos<br><em>tus dudas</em></h2><p>Aquí encontrarás las respuestas<br> a las preguntas más comunes.<br> Si necesitas más ayuda, nuestro<br> equipo está para ti.</p><a class="btn primary" href="https://wa.me/51937473120" target="_blank" rel="noopener noreferrer">${icon('whatsapp')}Habla con nosotros ${icon('chevron')}</a><span class="faq-copy-heart" aria-hidden="true">♡</span></div>
    <div class="faq-questions">${questions.map(({ symbol, question, answer }) => `<details class="faq-question" name="babycity-contact-faq"><summary><span class="faq-question-icon">${symbol}</span><span>${question}</span><i>${icon('chevron')}</i></summary><div class="faq-answer"><p>${answer}</p></div></details>`).join('')}</div>
    <div class="faq-art" aria-hidden="true"><span class="faq-art-heart">♡</span><svg class="faq-outline-cloud" viewBox="0 0 96 70"><path d="M21 59a16 16 0 0 1-7-30 19 19 0 0 1 30-17 21 21 0 0 1 39 18 16 16 0 0 1-3 31H21Z"/></svg><span class="faq-cloud cloud-small"></span><img src="/assets/contact/faq-baby-bear.webp" alt="" width="1536" height="1024" loading="lazy"><span class="faq-help-bubble">¡Estamos<br>para ayudarte!<small>♡</small></span></div>
    <div class="faq-benefits">${benefits.map(([symbol, title, copy]) => `<div><span class="faq-benefit-icon">${icon(symbol)}</span><span><strong>${title}</strong><small>${copy}</small></span></div>`).join('')}</div>
  </section>`;
}
