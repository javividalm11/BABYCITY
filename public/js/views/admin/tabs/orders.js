import { downloadText } from '../../../lib/dom.js';
import { esc, money } from '../../../lib/format.js';
import { notify } from '../../../lib/notify.js';
import { toCsv } from '../csv.js';
import { DELIVERY_LABELS, formatDateTime, STATUS_LABELS } from '../format.js';
import { request } from '../request.js';
import { admin } from '../state.js';

const view = { query: '', status: 'all' };

const CSV_HEADERS = [
  'Código',
  'Fecha',
  'Estado',
  'Cliente',
  'Celular',
  'Correo',
  'Entrega',
  'Dirección',
  'Productos',
  'Subtotal',
  'Envío',
  'Total',
  'Notas del cliente',
  'Nota interna',
];

const statusOptions = (current) =>
  Object.entries(STATUS_LABELS)
    .map(
      ([value, label]) =>
        `<option value="${value}" ${current === value ? 'selected' : ''}>${label}</option>`,
    )
    .join('');

const lines = (items) =>
  items.map((i) => `${i.quantity} × ${esc(i.name)} — ${money(i.price * i.quantity)}`).join('<br>');

function card(order) {
  const { data } = order;
  const shipping = data.shipping === null ? 'Por cotizar' : money(data.shipping);
  const total = data.total === null ? 'Total por confirmar' : `Total: ${money(data.total)}`;
  return `<article class="admin-record"><div class="admin-top"><h3>${esc(order.id)}</h3><span class="badge">${esc(formatDateTime(order.created))}</span></div><p><b>${esc(data.customer.name)}</b> · ${esc(data.customer.phone)}<br>${esc(data.customer.email)}<br>Entrega: ${esc(DELIVERY_LABELS[data.delivery] ?? data.delivery)} · ${esc(data.customer.address || 'Recojo en tienda')}</p><p>${lines(data.items)}</p><p>Subtotal: ${money(data.subtotal)} · Envío: ${shipping} · ${total}</p><p>${esc(data.notes)}</p><label>Estado<select data-order="${esc(order.id)}">${statusOptions(order.status)}</select></label><label>Nota interna (solo la ves tú)<textarea data-note="${esc(order.id)}" maxlength="1000" rows="2">${esc(data.internalNote ?? '')}</textarea></label><button class="btn secondary" data-save-note="${esc(order.id)}">Guardar nota</button><p class="fine">Confirmar o completar una solicitud no descuenta inventario automáticamente. Actualiza el stock del producto al cerrar la venta.</p></article>`;
}

function visibleOrders() {
  const query = view.query.toLowerCase();
  return admin.dashboard.orders.filter(({ id, status, data }) => {
    const text = `${id} ${data.customer.name} ${data.customer.phone}`.toLowerCase();
    return (view.status === 'all' || status === view.status) && text.includes(query);
  });
}

function csvRows(orders) {
  return orders.map(({ id, created, status, data }) => [
    id,
    created,
    STATUS_LABELS[status],
    data.customer.name,
    data.customer.phone,
    data.customer.email,
    DELIVERY_LABELS[data.delivery],
    data.customer.address,
    data.items.map((i) => `${i.quantity} x ${i.name}`).join('; '),
    data.subtotal,
    data.shipping ?? 'Por cotizar',
    data.total ?? 'Por confirmar',
    data.notes,
    data.internalNote ?? '',
  ]);
}

async function updateOrder(id, changes) {
  await request('/api/admin/orders', 'PATCH', { id, ...changes });
  const order = admin.dashboard.orders.find((o) => o.id === id);
  if ('status' in changes) order.status = changes.status;
  if ('note' in changes) order.data.internalNote = changes.note;
}

function bindList(list) {
  list.querySelectorAll('[data-order]').forEach((select) => {
    select.onchange = async () => {
      try {
        await updateOrder(select.dataset.order, { status: select.value });
        notify('Estado actualizado');
      } catch (error) {
        notify(error.message);
      }
    };
  });
  list.querySelectorAll('[data-save-note]').forEach((button) => {
    button.onclick = async () => {
      const id = button.dataset.saveNote;
      const note = list.querySelector(`[data-note="${CSS.escape(id)}"]`).value;
      try {
        await updateOrder(id, { note });
        notify('Nota guardada');
      } catch (error) {
        notify(error.message);
      }
    };
  });
}

function drawList(panel) {
  const orders = visibleOrders();
  const list = panel.querySelector('#orderList');
  list.innerHTML = orders.length
    ? orders.map(card).join('')
    : '<div class="empty">No hay pedidos con estos filtros. Cuando tus clientes registren una solicitud aparecerá aquí.</div>';
  panel.querySelector('#adminCount').textContent =
    `${orders.length} de ${admin.dashboard.orders.length} pedidos`;
  bindList(list);
}

export function renderOrders(panel) {
  const filters = [['all', 'Todos los estados'], ...Object.entries(STATUS_LABELS)]
    .map(
      ([id, label]) =>
        `<option value="${id}" ${view.status === id ? 'selected' : ''}>${label}</option>`,
    )
    .join('');
  panel.innerHTML = `<div class="admin-tools"><div class="admin-filters"><input id="orderSearch" type="search" placeholder="Buscar por código, nombre o celular…" aria-label="Buscar pedidos" value="${esc(view.query)}"><select id="orderStatus" aria-label="Filtrar por estado">${filters}</select></div><button id="exportOrders" class="btn secondary">Exportar a Excel (CSV) ↓</button></div><p class="fine" id="adminCount" role="status"></p><div id="orderList"></div>`;
  drawList(panel);
  panel.querySelector('#orderSearch').oninput = (event) => {
    view.query = event.target.value;
    drawList(panel);
  };
  panel.querySelector('#orderStatus').onchange = (event) => {
    view.status = event.target.value;
    drawList(panel);
  };
  panel.querySelector('#exportOrders').onclick = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadText(
      `babycity-pedidos-${stamp}.csv`,
      toCsv(CSV_HEADERS, csvRows(visibleOrders())),
      'text/csv;charset=utf-8',
    );
  };
}
