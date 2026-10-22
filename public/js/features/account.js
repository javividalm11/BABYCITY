import { $ } from '../lib/dom.js';
import { api } from '../lib/api.js';
import { esc } from '../lib/format.js';
import { notify } from '../lib/notify.js';
import { navigate } from './navigation.js';

const MIN_PASSWORD = 14;

const template = (username) =>
  `<button class="close" data-close aria-label="Cerrar">×</button><div class="account-head"><span class="account-avatar" aria-hidden="true">${esc(username.charAt(0).toUpperCase())}</span><div><span class="eyebrow">Administrador</span><h2>${esc(username)}</h2></div></div><nav class="account-menu" aria-label="Tu cuenta"><a class="account-item" href="/admin" data-link>Ir al panel</a><button class="account-item" type="button" data-account="password" aria-expanded="false">Cambiar contraseña</button><form id="passwordForm" hidden><label>Contraseña actual<input name="current" type="password" required autocomplete="current-password"></label><label>Nueva contraseña (mínimo ${MIN_PASSWORD} caracteres)<input name="next" type="password" required minlength="${MIN_PASSWORD}" maxlength="200" autocomplete="new-password"></label><label>Repite la nueva contraseña<input name="repeat" type="password" required minlength="${MIN_PASSWORD}" maxlength="200" autocomplete="new-password"></label><button class="btn primary" type="submit">Guardar contraseña</button><p class="form-status" role="status"></p><p class="fine">Al cambiarla se cierran tus sesiones en otros dispositivos.</p></form><button class="account-item" type="button" data-account="others">Cerrar otras sesiones</button><button class="account-item danger" type="button" data-account="logout">Cerrar sesión</button></nav>`;

// Si la sesión terminó mientras el perfil estaba abierto, lo cierro y aviso.
function handleError(error, dialog) {
  if (error.status !== 401) return notify(error.message);
  dialog.close();
  notify('Tu sesión terminó. Ingresa de nuevo.');
}

async function logout(dialog) {
  try {
    await api('/api/admin/logout', 'POST');
  } catch (error) {
    return handleError(error, dialog);
  }
  dialog.close();
  notify('Sesión cerrada');
  if (location.pathname === '/admin') await navigate('/admin', { replace: true });
}

async function revokeOthers(dialog) {
  try {
    const { closed } = await api('/api/admin/sessions/revoke', 'POST', {});
    notify(
      closed ? `Se cerraron ${closed} sesión(es) en otros dispositivos` : 'No había otras sesiones',
    );
  } catch (error) {
    handleError(error, dialog);
  }
}

async function submitPassword(event, dialog) {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector('.form-status');
  const { current, next, repeat } = Object.fromEntries(new FormData(form));
  status.classList.add('error');
  if (next !== repeat) {
    status.textContent = 'Las contraseñas nuevas no coinciden.';
    return;
  }
  const button = form.querySelector('button[type=submit]');
  button.disabled = true;
  try {
    await api('/api/admin/password', 'POST', { current, next });
    form.reset();
    form.hidden = true;
    dialog.querySelector('[data-account=password]').setAttribute('aria-expanded', 'false');
    status.textContent = '';
    notify('Contraseña actualizada');
  } catch (error) {
    if (error.status === 401) handleError(error, dialog);
    else status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

function render(dialog, admin) {
  $('#accountContent').innerHTML = template(admin.username);
  const form = $('#passwordForm');
  const toggle = dialog.querySelector('[data-account=password]');
  toggle.onclick = () => {
    form.hidden = !form.hidden;
    toggle.setAttribute('aria-expanded', String(!form.hidden));
    if (!form.hidden) form.elements.current.focus();
  };
  form.onsubmit = (event) => submitPassword(event, dialog);
  dialog.querySelector('[data-account=others]').onclick = () => revokeOthers(dialog);
  dialog.querySelector('[data-account=logout]').onclick = () => logout(dialog);
}

async function currentAdmin() {
  try {
    return (await api('/api/session')).admin;
  } catch {
    return null;
  }
}

// El botón Cuenta abre el perfil si hay un administrador conectado; si no, la atención personalizada.
export async function openAccount() {
  const admin = await currentAdmin();
  if (!admin) return $('#contactDialog').showModal();
  const dialog = $('#accountDialog');
  render(dialog, admin);
  dialog.showModal();
}
