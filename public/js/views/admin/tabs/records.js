import { esc } from '../../../lib/format.js';
import { notify } from '../../../lib/notify.js';
import { daysSince, formatDateTime } from '../format.js';
import { request } from '../request.js';
import { admin } from '../state.js';

const view = { leads: 'pending', claims: 'pending' };

const KINDS = {
  leads: {
    api: 'lead',
    empty: 'Todavía no hay consultas.',
    none: 'No tienes consultas pendientes.',
    card: (record) => {
      const { data } = record;
      const phone = String(data.phone).replace(/\D/g, '');
      return `<h3>${esc(data.name)}</h3><p>${esc(data.phone)} · ${esc(formatDateTime(record.created))}</p><p>${esc(data.message)}</p><a href="https://wa.me/${phone}" target="_blank" rel="noopener noreferrer" class="text-link">Responder en WhatsApp ↗</a>`;
    },
  },
  claims: {
    api: 'claim',
    empty: 'No hay reclamaciones registradas.',
    none: 'No tienes reclamaciones pendientes.',
    card: (record) => {
      const { data } = record;
      return `<span class="badge">${esc(record.id)} · ${esc(data.type)}</span><span class="badge ${data.handled ? '' : 'warn'}">${esc(daysSince(record.created))}</span><h3>${esc(data.name)}</h3><p>Fecha: ${esc(formatDateTime(record.created))}<br>Documento: ${esc(data.document)}<br>Correo: ${esc(data.email)} · Celular: ${esc(data.phone)}<br>Domicilio: ${esc(data.address)}</p><p><b>Producto o servicio:</b> ${esc(data.product)}</p><p><b>Detalle:</b> ${esc(data.detail)}</p><p><b>Solicitud:</b> ${esc(data.request)}</p><p class="fine">Gestiona la respuesta al correo del cliente dentro del plazo legal. Este panel no envía respuestas automáticas.</p>`;
    },
  },
};

function handledControl(record) {
  if (!record.data.handled) {
    return `<button class="btn primary" data-handle="${esc(record.id)}" data-value="true">Marcar como atendido</button>`;
  }
  const when = record.data.handledAt ? ` el ${esc(formatDateTime(record.data.handledAt))}` : '';
  return `<span class="badge done">Atendido${when}</span> <button class="btn secondary" data-handle="${esc(record.id)}" data-value="false">Reabrir</button>`;
}

function drawList(panel, name) {
  const kind = KINDS[name];
  const all = admin.dashboard[name];
  const pending = view[name] === 'pending';
  const records = pending ? all.filter((r) => !r.data.handled) : all;
  const list = panel.querySelector('#recordList');
  list.innerHTML = records.length
    ? records
        .map(
          (r) =>
            `<article class="admin-record">${kind.card(r)}<div class="admin-actions">${handledControl(r)}</div></article>`,
        )
        .join('')
    : `<div class="empty">${all.length ? kind.none : kind.empty}</div>`;
  panel.querySelector('#adminCount').textContent = `${records.length} de ${all.length} registros`;
  list.querySelectorAll('[data-handle]').forEach((button) => {
    button.onclick = async () => {
      const handled = button.dataset.value === 'true';
      try {
        const { handledAt } = await request('/api/admin/records', 'PATCH', {
          kind: kind.api,
          id: button.dataset.handle,
          handled,
        });
        const record = all.find((r) => r.id === button.dataset.handle);
        Object.assign(record.data, { handled, handledAt });
        notify(handled ? 'Marcado como atendido' : 'Reabierto');
        admin.redraw();
      } catch (error) {
        notify(error.message);
      }
    };
  });
}

export function renderRecords(panel, name) {
  panel.innerHTML = `<div class="admin-tools"><div class="admin-filters"><select id="recordFilter" aria-label="Filtrar registros"><option value="pending" ${view[name] === 'pending' ? 'selected' : ''}>Pendientes</option><option value="all" ${view[name] === 'all' ? 'selected' : ''}>Todos</option></select></div></div><p class="fine" id="adminCount" role="status"></p><div id="recordList"></div>`;
  drawList(panel, name);
  panel.querySelector('#recordFilter').onchange = (event) => {
    view[name] = event.target.value;
    drawList(panel, name);
  };
}
