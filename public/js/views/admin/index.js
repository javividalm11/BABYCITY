import { api } from '../../lib/api.js';
import { startIdleWatch, stopIdleWatch } from './idle.js';
import { renderLogin } from './login.js';
import { request } from './request.js';
import { drawShell } from './shell.js';
import { admin } from './state.js';

async function enterPanel() {
  admin.dashboard = await api('/api/admin/dashboard');
  admin.tab = 'products';
  drawShell();
  startIdleWatch(async () => {
    await request('/api/admin/logout', 'POST').catch(() => {});
    admin.showLogin('Cerramos tu sesión por inactividad.');
  });
}

// Detengo el control de inactividad al salir del panel.
export function leaveAdmin() {
  stopIdleWatch();
  admin.dashboard = null;
}

// Punto de entrada: muestra el panel si hay sesión y el inicio de sesión si no la hay.
export async function renderAdmin(target) {
  admin.main = target;
  admin.enter = enterPanel;
  admin.redraw = drawShell;
  admin.showLogin = (notice) => {
    stopIdleWatch();
    admin.dashboard = null;
    renderLogin(notice);
  };
  try {
    await enterPanel();
  } catch {
    admin.showLogin();
  }
}
