import { esc } from '../../../lib/format.js';
import { ACTION_LABELS, formatDateTime } from '../format.js';
import { request } from '../request.js';

const row = (entry) =>
  `<tr><td>${esc(formatDateTime(entry.at))}</td><td>${esc(entry.actor)}</td><td>${esc(ACTION_LABELS[entry.action] ?? entry.action)}</td><td>${esc(entry.target)}</td><td>${esc(entry.detail)}</td></tr>`;

export async function renderActivity(panel) {
  panel.innerHTML = '<p class="fine" role="status">Cargando actividad…</p>';
  try {
    const entries = await request('/api/admin/activity', 'GET');
    panel.innerHTML = entries.length
      ? `<p class="fine">Últimas ${entries.length} acciones. Se conservan 6 meses.</p><div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Elemento</th><th>Detalle</th></tr></thead><tbody>${entries.map(row).join('')}</tbody></table></div>`
      : '<div class="empty">Aún no hay actividad registrada.</div>';
  } catch (error) {
    panel.innerHTML = `<p class="form-status error" role="status">${esc(error.message)}</p>`;
  }
}
