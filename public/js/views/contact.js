import { icon } from '../lib/icons.js';
import { esc } from '../lib/format.js';
import { renderContactAdvice } from '../components/contact-advice.js';
import { renderContactFaq } from '../components/contact-faq.js';

const whatsapp = 'https://wa.me/51937473120';
const mapQuery = 'Jr. Antonio Raymondi 512, La Victoria, Lima, Perú';
const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
const mapEmbed = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;
const pin =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
const phone =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 3 3 5-3 3c2 3 3 4 6 6l3-3 5 3-1 4C10 23 1 14 3 4l4-1Z"/></svg>';
export function contact() {
  return `<div class="contact-page">
    <section class="contact-hero" aria-labelledby="contact-title">
      <img class="contact-hero-photo" src="/assets/contact/mother-baby.webp" alt="Una mamá abraza a su bebé en una habitación acogedora" width="1536" height="1024" fetchpriority="high">
      <div class="contact-hero-inner"><div class="contact-hero-copy"><span class="eyebrow">De mamá a mamá</span><h1 id="contact-title">Estamos cerquita de ti</h1><p>Escríbenos por WhatsApp, visítanos en nuestra tienda física<br>o cuéntanos qué necesitas. ¡Estamos para ayudarte!</p><a class="btn primary" href="${whatsapp}" target="_blank" rel="noopener noreferrer">${icon('chat')}Conversemos por WhatsApp ${icon('arrow')}</a></div>
      <span class="contact-hero-note" aria-hidden="true">♡<span>Te ayudamos a elegir<br>lo mejor para tu bebé</span></span><span class="contact-hero-sticker" aria-hidden="true">♡<small>Tu bebé,<br>nuestra<br>prioridad</small></span></div>
    </section>
    <div class="contact-body">
      <nav class="contact-shortcuts" aria-label="Elige cómo conversar con BabyCity">
        <a href="${whatsapp}" target="_blank" rel="noopener noreferrer"><span class="contact-shortcut-icon whatsapp">${icon('chat')}</span><span><strong>WhatsApp</strong><small>Resuelve tus dudas, recibe asesoría<br>y haz tu pedido por WhatsApp.</small></span><i>${icon('arrow')}</i></a>
        <a href="#contact-store"><span class="contact-shortcut-icon pink">${icon('store')}</span><span><strong>Tienda física</strong><small>Visítanos en La Victoria y conoce<br>nuestros productos en persona.</small></span><i>${icon('arrow')}</i></a>
        <a href="#contact-advice"><span class="contact-shortcut-icon">${icon('headset')}</span><span><strong>Atención personalizada</strong><small>Te ayudamos a elegir lo mejor<br>para tu bebé.</small></span><i>${icon('arrow')}</i></a>
      </nav>
      <section class="contact-location" id="contact-store" aria-labelledby="contact-store-title">
        <div class="contact-store-card"><div class="contact-store-copy"><span class="eyebrow">Visítanos en La Victoria</span><h2 id="contact-store-title">Conoce nuestra tienda</h2>
          <ul class="contact-store-details"><li>${pin}<span>Jr. Antonio Raymondi 512<small>La Victoria, Lima, Perú</small></span></li><li>${phone}<a href="tel:+51937473120">+51 937 473 120</a></li><li>${icon('book')}<span>GRUPO BABY STORE S.A.C.<small>RUC 20614491036</small></span></li></ul>
          <div class="contact-store-actions"><button class="btn primary" data-action="contact">${icon('store')}Coordinar mi visita</button><a class="btn secondary" href="${whatsapp}" target="_blank" rel="noopener noreferrer">${icon('chat')}Escribir por WhatsApp</a></div>
        </div><figure class="contact-store-photo"><img src="/assets/community/tiktok-tienda.webp" alt="Captura real de los productos y la atención en la tienda BabyCity" width="253" height="329" loading="lazy"><figcaption>¡Te esperamos! <span aria-hidden="true">♡</span></figcaption></figure></div>
        <div class="contact-map"><iframe title="Ubicación de BabyCity en La Victoria, Lima" src="${esc(mapEmbed)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe><a class="contact-map-card" href="${esc(maps)}" target="_blank" rel="noopener noreferrer"><span>${pin}</span><div><strong>BabyCity Perú</strong><small>Jr. Antonio Raymondi 512<br>La Victoria, Lima, Perú</small><b>Abrir en Google Maps ↗</b></div></a></div>
      </section>
      ${renderContactAdvice()}

      ${renderContactFaq()}
    </div>
  </div>`;
}
