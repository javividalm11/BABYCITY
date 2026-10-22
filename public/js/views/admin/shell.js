import { stopIdleWatch } from './idle.js';
import { request } from './request.js';
import { admin, openOrders, pendingCount, TABS } from './state.js';
import { renderActivity } from './tabs/activity.js';
import { renderOrders } from './tabs/orders.js';
import { renderProducts } from './tabs/products.js';
import { renderRecords } from './tabs/records.js';
import { renderSettings } from './tabs/settings.js';

const PANELS = {
  products: renderProducts,
  orders: renderOrders,
  leads: (panel) => renderRecords(panel, 'leads'),
  claims: (panel) => renderRecords(panel, 'claims'),
  activity: renderActivity,
  settings: renderSettings,
};

const stat = (value, label) =>
  `<div class="stat"><strong>${value}</strong><small>${label}</small></div>`;

function template() {
  const { products } = admin.dashboard;
  const stats = [
    stat(products.filter((p) => p.active).length, 'Productos publicados'),
    stat(products.filter((p) => p.stock === null).length, 'Existencias por confirmar'),
    stat(openOrders().length, 'Solicitudes abiertas'),
    stat(pendingCount(), 'Consultas y reclamos por atender'),
  ].join('');
  const tabs = TABS.map(
    ([id, title]) =>
      `<button data-tab="${id}" class="${admin.tab === id ? 'active' : ''}" aria-pressed="${admin.tab === id}">${title}</button>`,
  ).join('');
  return `<section class="admin-section"><div class="admin-top"><div><span class="eyebrow">Tu tienda, en tus manos</span><h1>Hola, BabyCity.</h1></div><button class="btn secondary" id="logout">Cerrar sesión ↗</button></div><div class="stats">${stats}</div><nav class="admin-tabs" aria-label="Administración">${tabs}</nav><div id="adminPanel"></div></section>`;
}

export function drawShell() {
  admin.main.innerHTML = template();
  admin.main.querySelector('#logout').onclick = async () => {
    try {
      await request('/api/admin/logout', 'POST');
    } catch {
      // Si el servidor ya cerró la sesión, igual muestro el inicio de sesión.
    }
    stopIdleWatch();
    admin.showLogin();
  };
  admin.main.querySelectorAll('[data-tab]').forEach((button) => {
    button.onclick = () => {
      admin.tab = button.dataset.tab;
      drawShell();
    };
  });
  PANELS[admin.tab](admin.main.querySelector('#adminPanel'));
}
