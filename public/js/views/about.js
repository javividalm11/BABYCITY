import { renderAboutPurpose } from '../components/customer-stories.js';
import { icon } from '../lib/icons.js';
import { renderAboutTikTok, tiktokProfile } from '../components/about-tiktok.js';

const maps =
  'https://www.google.com/maps/search/?api=1&query=Jr.+Antonio+Raymondi+512+La+Victoria+Lima+Peru';
const pin =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
const benefits = [
  ['heart', 'Asesoría cercana', 'Te escuchamos y te ayudamos siempre.'],
  ['store', 'Tienda física y virtual', 'Compra como prefieras, de forma segura.'],
  ['truck', 'Envíos a todo el Perú', 'Coordinamos la entrega hasta tu casa.'],
  ['shield', 'Compra con confianza', 'Te acompañamos con atención personalizada.'],
];

export function about() {
  return `<div class="about-page">
    <section class="about-intro" aria-labelledby="about-title"><div class="about-intro-inner">
      <div class="about-intro-copy"><span class="about-eyebrow">Conoce BabyCity</span><h1 id="about-title">Detrás de cada<br>elección,<em>hay una familia.</em></h1><p>La tuya nos inspira. Por eso te escuchamos y te ayudamos a encontrar lo que tu bebé necesita, con la cercanía de mamá a mamá.</p><a class="about-button" href="#about-story">Conoce nuestra historia ${icon('arrow')}</a><span class="about-hero-heart" aria-hidden="true">♡</span></div>
      <div class="about-intro-photos"><figure class="about-portrait"><img src="/assets/ceobabycity.jpg" alt="Representante de BabyCity con una caja de la marca en Perú Business Fest" width="960" height="1280" fetchpriority="high"></figure><figure class="about-intro-secondary"><img src="/assets/nosotros2.jpg" alt="BabyCity compartiendo experiencias con otros emprendedores" width="960" height="1280" fetchpriority="high"></figure><svg class="about-sun" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="15"/><path d="M40 6v9m0 50v9M6 40h9m50 0h9M16 16l7 7m34 34 7 7M16 64l7-7m34-34 7-7"/></svg><span class="about-photo-hearts" aria-hidden="true">♡<br>♡</span></div>
    </div></section>

    <div class="about-benefits">${benefits.map(([symbol, title, copy]) => `<div>${icon(symbol)}<span><strong>${title}</strong><small>${copy}</small></span></div>`).join('')}</div>

    <section class="about-story" id="about-story" aria-labelledby="about-story-title">
      <div class="about-story-copy"><span class="about-eyebrow">Un poquito de nosotros</span><h2 id="about-story-title">Crecemos para<br>acompañarte mejor.</h2><p>Somos una tienda física y virtual de productos para bebés. Nos gusta mostrarte cada detalle, responder tus preguntas y ayudarte a comparar opciones con calma.</p><p>También seguimos aprendiendo y compartiendo con otros emprendedores. Cada experiencia nos inspira a cuidar mejor lo que hacemos para tu familia.</p><div class="about-story-note">${icon('heart')}<span>Productos para su mundo.<br><strong>Personas que están para ti.</strong></span></div></div>
      <div class="about-gallery"><figure><img src="/assets/nosotros.jpg" alt="Integrantes del equipo de BabyCity en Perú Business Fest" width="960" height="1280" loading="lazy"><figcaption>Compartimos experiencias</figcaption></figure><figure><img src="/assets/nosotros2.jpg" alt="Encuentro de BabyCity con otros emprendedores en Perú Business Fest" width="960" height="1280" loading="lazy"><figcaption>Seguimos aprendiendo</figcaption></figure><p>Momentos de BabyCity<br>en Perú Business Fest. <span aria-hidden="true">♡</span></p></div>
    </section>

    ${renderAboutPurpose()}
    <section class="about-live" aria-labelledby="about-live-title">
      <div class="about-live-copy"><span class="about-eyebrow">Conócenos de cerca</span><h2 id="about-live-title">También estamos<br>al otro lado de la pantalla.</h2><p>En TikTok compartimos nuestro día a día, te mostramos los productos y conversamos contigo. Nos encanta que conozcas a las personas detrás de BabyCity.</p><a class="about-button" href="${tiktokProfile}" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="about-tiktok-note" d="M14 3h4c0 3 2 5 5 5v4c-2 0-4-1-5-2v8a6 6 0 1 1-6-6v4a2 2 0 1 0 2 2V3Z"/></svg>Síguenos en TikTok ${icon('arrow')}</a><span class="about-profile">@babycityperu</span><span class="about-live-hearts" aria-hidden="true">♡<small>♡</small></span></div>
      ${renderAboutTikTok()}
    </section>

    <section class="about-store" aria-labelledby="about-store-title"><div class="about-store-copy"><span class="about-eyebrow">Visítanos</span><h2 id="about-store-title">Te esperamos en<br>nuestra tienda física.</h2><p>Ven a conocer nuestro espacio en La Victoria, Lima. Podrás ver nuestros productos, resolver tus dudas y recibir asesoría personalizada.</p><a class="about-button" href="${maps}" target="_blank" rel="noopener noreferrer">Ver en Google Maps ${icon('arrow')}</a></div><figure class="about-store-photo"><img src="/assets/community/tiktok-tienda.webp" alt="Captura real de TikTok que muestra los productos y la atención en la tienda BabyCity" width="253" height="329" loading="lazy"><figcaption>Un vistazo a nuestra tienda</figcaption></figure><div class="about-store-details"><h3>${icon('store')}Nuestra tienda</h3><p>${pin}<span>La Victoria, Lima</span></p><p>${icon('truck')}<span>Envíos a todo el Perú</span></p><a href="${maps}" target="_blank" rel="noopener noreferrer">Cómo llegar ${icon('arrow')}</a></div></section>

    <section class="about-closing" aria-labelledby="about-closing-title"><img class="about-mother" src="/assets/about/mother-baby-illustration.webp" alt="" width="700" height="700" loading="lazy"><div class="about-closing-copy"><h2 id="about-closing-title">Estamos aquí para acompañarte</h2><p>¿Tienes preguntas? Escríbenos, estamos para ayudarte.</p><button class="about-button" data-action="contact">${icon('chat')}Conversemos por WhatsApp ${icon('arrow')}</button></div><span class="about-closing-note" aria-hidden="true">Porque<br>cada bebé<br>hace un mundo<br>más bonito. ♡</span></section>
  </div>`;
}
