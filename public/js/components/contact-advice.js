import { icon } from '../lib/icons.js';
import { esc } from '../lib/format.js';
import { products } from '../state/store.js';

export function renderContactAdvice() {
  const categories = [...new Set(products.map((product) => product.category))];
  return `<section class="contact-advice" id="contact-advice" aria-labelledby="contact-advice-title">
        <img class="contact-advice-teddy" src="/assets/community/teddy-contact.webp" alt="" width="720" height="556" loading="lazy">
        <div class="contact-advice-copy"><span class="eyebrow">Cuéntanos qué necesita tu bebé</span><h2 id="contact-advice-title">Te asesoramos<br>con mucho amor</h2><p>Completa el formulario y nuestro equipo te responderá lo más pronto posible.</p></div>
        <form id="contactPageForm" class="contact-advice-form">
          <label class="contact-field-name">Nombre completo<input name="name" placeholder="Tu nombre" required minlength="2" maxlength="120" autocomplete="name"></label>
          <label class="contact-field-phone">WhatsApp<span class="contact-phone-input"><span aria-hidden="true"><i class="contact-peru-flag"></i> +51</span><input name="phone" aria-label="WhatsApp" placeholder="937 473 120" type="tel" required pattern="[+0-9\\s\\-]{9,18}" autocomplete="tel"></span></label>
          <label class="contact-field-category">¿Qué estás buscando?<select name="category" required><option value="">Selecciona una opción</option>${categories.map((category) => `<option value="${esc(category)}">${esc(category)}</option>`).join('')}<option value="Otra consulta">Otra consulta</option></select></label>
          <label class="contact-field-message">Mensaje<textarea name="message" placeholder="Cuéntanos más detalles…" required minlength="3" maxlength="900" rows="3"></textarea></label>
          <button class="btn primary" type="submit">Quiero ayuda personalizada ${icon('arrow')}</button>
          <label class="check contact-consent"><input name="consent" type="checkbox" required><span>Autorizo el uso de mis datos para atender mi consulta según la <a href="/legal/privacidad" data-link>política de privacidad</a>.</span></label>
          <p class="form-status" role="status" aria-live="polite"></p>
        </form>
        <div class="contact-advice-decor" aria-hidden="true"><span>Nuestro equipo<br>te responderá<br>muy pronto ♡</span><div class="contact-rainbow"></div></div>
      </section>`;
}
