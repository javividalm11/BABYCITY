import { icon } from '../lib/icons.js';
import { esc, money } from '../lib/format.js';

const chevron = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
const send =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 18-7-7 18-3-8-8-3Zm8 3L21 3"/></svg>';

export function renderChatShell() {
  return `<header class="chat-header"><div><img class="chat-brand" src="/assets/logo-transparent.png" alt="BabyCity" width="606" height="330"><div class="chat-status"><span aria-hidden="true"></span><div><strong id="chatTitle">Asistente BabyCity</strong><small>Aquí para ayudarte</small></div></div></div><button id="chatClose" type="button" class="chat-icon-button" aria-label="Cerrar asistente">×</button><img class="chat-mascot" src="/assets/community/teddy-contact.webp" alt="" width="720" height="556"><span class="chat-welcome-heart" aria-hidden="true">♡</span></header>
    <div class="chat-scroll"><section class="chat-welcome"><h2>¡Hola! Soy el asistente<br>de BabyCity <span>♡</span></h2><p>Resuelve tus dudas sobre productos, envíos,<br>tienda física, catálogos y pedidos.</p></section>
    <nav class="chat-shortcuts" aria-label="Accesos rápidos del asistente"><a href="/tienda" data-link>${icon('bag')}<span>Ver productos</span>${chevron}</a><button type="button" data-chat-question="¿Hacen envíos a provincias?">${icon('truck')}<span>Envíos</span>${chevron}</button><a href="/catalogos" data-link>${icon('book')}<span>Catálogos</span>${chevron}</a><a href="/contacto" data-link>${icon('store')}<span>Tienda física</span>${chevron}</a><button type="button" data-action="contact" data-chat-handoff>${icon('user')}<span>Hablar con asesor</span>${chevron}</button></nav>
    <div class="chat-messages" id="chatMessages" role="log" aria-label="Conversación con BabyCity" aria-live="polite" aria-relevant="additions"></div></div>
    <div class="chat-composer"><div class="chat-suggestions" aria-label="Preguntas sugeridas"><button type="button" data-chat-question="¿Cómo comprar?">¿Cómo comprar?</button><button type="button" data-chat-question="¿Hacen envíos a provincias?">¿Hacen envíos a provincia?</button><button type="button" data-chat-question="¿Dónde están ubicados?">¿Dónde están ubicados?</button></div><form id="chatForm"><input id="chatInput" name="message" aria-label="Tu consulta al asistente" placeholder="Escribe tu consulta…" maxlength="500" autocomplete="off" required><button type="button" class="chat-emoji" aria-label="Añadir un corazón" data-chat-emoji>☺</button><button class="chat-send" type="submit" aria-label="Enviar consulta">${send}</button></form><div class="chat-whatsapp"><span aria-hidden="true"></span><a href="https://wa.me/51937473120" target="_blank" rel="noopener noreferrer">${icon('chat')}<span>Si lo prefieres, te conectamos con <strong>WhatsApp</strong></span>${chevron}</a><span aria-hidden="true"></span></div></div>`;
}

function renderProduct(product, favorites) {
  const saved = favorites.includes(product.id);
  return `<article class="chat-product"><div class="chat-product-photo"><img src="${esc(product.image)}" alt="${esc(product.name)}" width="90" height="90"><button class="wish${saved ? ' saved' : ''}" data-wish="${esc(product.id)}" aria-label="${saved ? 'Quitar de favoritos' : 'Guardar en favoritos'}" aria-pressed="${saved}">${icon('heart')}</button></div><div><h3>${esc(product.name)}</h3><p>${product.stock === null ? 'Disponibilidad por confirmar' : 'Disponible'}</p><strong>${money(product.price)}</strong><a href="/producto/${esc(product.id)}" data-link>Ver producto ${icon('arrow')}</a></div></article>`;
}

export function renderChatMessage(role, text, reply = {}, favorites = []) {
  const time = new Date().toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `<div class="chat-message chat-message-${role}">${role === 'assistant' ? '<img class="chat-avatar" src="/assets/community/teddy-contact.webp" alt="Asistente BabyCity" width="26" height="26">' : ''}<div class="chat-message-content"><div class="chat-bubble"><p>${esc(text)}</p></div>${(reply.products || []).map((product) => renderProduct(product, favorites)).join('')}${reply.links?.length ? `<div class="chat-reply-links">${reply.links.map(({ label, href }) => `<a href="${esc(href)}" data-link>${esc(label)} ${chevron}</a>`).join('')}</div>` : ''}${reply.handoff ? '<button class="chat-handoff" type="button" data-action="contact" data-chat-handoff>Hablar con una asesora ↗</button>' : ''}<time>${time}${role === 'user' ? ' <span aria-label="Enviado">✓✓</span>' : ''}</time></div></div>`;
}
