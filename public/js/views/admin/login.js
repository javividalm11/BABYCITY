import { api } from '../../lib/api.js';
import { esc } from '../../lib/format.js';
import { admin } from './state.js';

const template = (notice) =>
  `<section class="admin-section"><div class="admin-login"><span class="eyebrow">BabyCity · Administración</span><h1>Hola de nuevo.</h1><p>Ingresa para cuidar cada detalle de tu tienda.</p><form id="adminLogin"><label>Usuario<input name="username" required autocomplete="username"></label><label>Contraseña<input name="password" type="password" required autocomplete="current-password"></label><button class="btn primary">Ingresar →</button><p class="form-status ${notice ? 'error' : ''}" role="status">${esc(notice)}</p></form><p class="fine">Si aún no tienes acceso, solicita al responsable técnico que configure tu cuenta.</p></div></section>`;

export function renderLogin(notice = '') {
  admin.main.innerHTML = template(notice);
  document.querySelector('#adminLogin').onsubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button');
    button.disabled = true;
    try {
      await api('/api/admin/login', 'POST', Object.fromEntries(new FormData(form)));
      await admin.enter();
    } catch (error) {
      const status = form.querySelector('.form-status');
      status.classList.add('error');
      status.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  };
}
