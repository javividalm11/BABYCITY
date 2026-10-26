import { icon } from '../../lib/icons.js';

export function renderShoppingBenefits() {
  const benefits = [
    [
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></svg>',
      'Productos innovadores',
      'Seleccionamos artículos prácticos y funcionales que facilitan el día a día con tu bebé.',
    ],
    [
      icon('shield'),
      'Calidad y confianza',
      'Conoce las características de cada modelo y recibe asesoría para elegir lo que tu bebé necesita.',
    ],
    [
      icon('whatsapp'),
      'Atención cercana',
      'Te atendemos de mamá a mamá: con cercanía, honestidad y atención personalizada.',
    ],
  ];
  return `<section class="shopping-benefits" aria-labelledby="shopping-benefits-title"><div class="shopping-section-inner"><header><h2 id="shopping-benefits-title">¿Por qué comprar en BabyCity?</h2><p>Lo que buscas para tu bebé, con la confianza de una marca que crece contigo.</p></header><div class="shopping-benefit-grid">${benefits.map(([symbol, title, description]) => `<article><span class="shopping-benefit-icon">${symbol}</span><h3>${title}</h3><p>${description}</p></article>`).join('')}</div></div></section>`;
}

export function renderShoppingChannels() {
  return `<section class="shopping-channels" aria-labelledby="shopping-channels-title"><div class="shopping-section-inner"><header><h2 id="shopping-channels-title">Encuéntranos donde te quede más fácil</h2><p>Elige el canal que prefieras para conocer nuestros productos y hacer tu pedido.</p></header><div class="shopping-channel-grid">
    <article class="shopping-channel channel-whatsapp"><span class="shopping-channel-label">Pedidos directos</span><h3>WhatsApp</h3><p>Escríbenos y te ayudamos a elegir el producto ideal para tu bebé, con atención personalizada.</p><a href="https://wa.me/51937473120" target="_blank" rel="noopener noreferrer" aria-label="Conversemos por WhatsApp">Conversemos por WhatsApp ${icon('arrow')}</a></article>
    <article class="shopping-channel channel-tiktok"><span class="shopping-channel-label">Compra en vivo</span><h3>TikTok Live</h3><p>Síguenos y participa en nuestros lives, donde mostramos cada producto y respondemos tus dudas.</p><a href="https://www.tiktok.com/@babycityperu" target="_blank" rel="noopener noreferrer" aria-label="Visitar BabyCity en TikTok">@babycityperu ${icon('arrow')}</a></article>
    <article class="shopping-channel channel-catalog"><span class="shopping-channel-label">Todo en un solo lugar</span><h3>Catálogo completo</h3><p>Explora nuestras colecciones, con fotos y detalles de cada producto, antes de hacer tu pedido.</p><a href="/catalogos" data-link>Ver catálogo ${icon('arrow')}</a></article>
    <article class="shopping-channel channel-falabella"><span class="shopping-channel-label">También en Falabella</span><h3>Saga Falabella</h3><p>También nos encuentras como BABY STORE en la plataforma de Falabella. Conoce nuestros productos en su tienda.</p><a href="https://www.falabella.com.pe/falabella-pe/seller/BABY%20STORE" target="_blank" rel="noopener noreferrer" aria-label="Ir a Baby Store en Falabella">Ir a la tienda ${icon('arrow')}</a></article>
  </div></div></section>`;
}
