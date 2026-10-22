import { downloadText } from '../../../lib/dom.js';
import { esc } from '../../../lib/format.js';
import { notify } from '../../../lib/notify.js';
import { request } from '../request.js';
import { admin } from '../state.js';

function template(settings) {
  return `<div class="info-grid"><section class="info-card"><h2>Tarifas de envío</h2><p>Deja el campo vacío para mostrar «Por cotizar». El recojo en tienda siempre es gratuito. Publica una tarifa solo si aplica al ámbito completo de esa opción.</p><form id="shippingForm"><label>Envío a Lima (S/)<input name="lima" type="number" step="0.01" min="0" max="10000" value="${esc(settings.lima ?? '')}"></label><label>Envío a provincias (S/)<input name="province" type="number" step="0.01" min="0" max="10000" value="${esc(settings.province ?? '')}"></label><button class="btn primary">Guardar tarifas</button><p class="form-status" role="status"></p></form></section><section class="info-card"><h2>Respaldo de tus datos</h2><p>Descarga productos, pedidos, consultas y reclamaciones. El archivo contiene datos personales: guárdalo en un lugar seguro y compártelo únicamente con personal autorizado.</p><button class="btn secondary" id="exportData">Descargar respaldo JSON ↓</button><p class="fine">El respaldo completo de la base de datos se realiza en el servidor con npm run backup. Las imágenes y PDF se respaldan por separado.</p></section></div>`;
}

async function saveRates(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const rates = Object.fromEntries(new FormData(form));
  for (const key in rates) rates[key] = rates[key] === '' ? null : Number(rates[key]);
  try {
    await request('/api/admin/settings', 'PUT', rates);
    admin.dashboard.settings = rates;
    notify('Tarifas guardadas');
  } catch (error) {
    form.querySelector('.form-status').textContent = error.message;
  }
}

function exportBackup() {
  const stamp = new Date().toISOString().slice(0, 10);
  const content = JSON.stringify(
    { ...admin.dashboard, exported: new Date().toISOString() },
    null,
    2,
  );
  downloadText(`babycity-respaldo-${stamp}.json`, content, 'application/json');
}

export function renderSettings(panel) {
  panel.innerHTML = template(admin.dashboard.settings);
  panel.querySelector('#shippingForm').onsubmit = saveRates;
  panel.querySelector('#exportData').onclick = exportBackup;
}
