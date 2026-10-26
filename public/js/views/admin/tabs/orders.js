import { downloadText } from '../../../lib/dom.js';
import { esc, money } from '../../../lib/format.js';
import { notify } from '../../../lib/notify.js';
import { toCsv } from '../csv.js';
import { DELIVERY_LABELS, formatDateTime, STATUS_LABELS } from '../format.js';
import { request } from '../request.js';
import { admin } from '../state.js';
import {
  paymentLabel,
  paymentStatusLabel,
  receiptChannelLabel,
} from '../../../content/payment-methods.js';

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
  'Medio de pago',
  'Verificación de pago',
  'Envío del comprobante',
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

function paymentReview(order) {
  const payment = order.data.payment;
  if (!payment?.receipt)
    return `<p class="fine">${esc(receiptChannelLabel(payment))}. Sin comprobante adjunto en el panel.</p>`;
  const reviewed = payment.reviewedAt
    ? `<p class="fine">Última revisión: ${esc(payment.reviewedBy)} · ${esc(formatDateTime(payment.reviewedAt))}</p>`
    : '';
  return `<section aria-label="Revisión del comprobante"><p>Comprobante subido al panel</p><img class="admin-receipt-preview" src="/api/admin/orders/${esc(order.id)}/receipt" alt="Comprobante de pago adjunto por el cliente" loading="lazy"><a class="btn secondary" href="/api/admin/orders/${esc(order.id)}/receipt" target="_blank" rel="noopener noreferrer">Ver comprobante</a><p class="fine">Verifica el abono en la cuenta oficial antes de validar. La captura por sí sola no acredita el pago. Registra las observaciones en la nota interna.</p><div class="admin-actions"><button class="btn primary" data-review-payment="${esc(order.id)}" data-payment-status="verified">Validar abono</button><button class="btn secondary" data-review-payment="${esc(order.id)}" data-payment-status="rejected">Rechazar comprobante</button><button class="btn secondary" data-review-payment="${esc(order.id)}" data-payment-status="pending_verification">Volver a pendiente</button></div>${reviewed}</section>`;
}

function card(order) {
  const { data } = order;
  const shipping = data.shipping === null ? 'Por cotizar' : money(data.shipping);
  const total = data.total === null ? 'Total por confirmar' : `Total: ${money(data.total)}`;
  return `<article class="admin-record"><div class="admin-top"><h3>${esc(order.id)}</h3><span class="badge">${esc(formatDateTime(order.created))}</span></div><p><b>${esc(data.customer.name)}</b> · ${esc(data.customer.phone)}<br>${esc(data.customer.email)}<br>Entrega: ${esc(DELIVERY_LABELS[data.delivery] ?? data.delivery)} · ${esc(data.customer.address || 'Recojo en tienda')}</p><p>${lines(data.items)}</p><p>Subtotal: ${money(data.subtotal)} · Envío: ${shipping} · ${total}</p><p>Medio de pago: <b>${esc(paymentLabel(data.payment?.method))}</b><br>${esc(paymentStatusLabel(data.payment?.status))}</p>${paymentReview(order)}<p>${esc(data.notes)}</p><label>Estado<select data-order="${esc(order.id)}">${statusOptions(order.status)}</select></label><label>Nota interna (solo la ves tú)<textarea data-note="${esc(order.id)}" maxlength="1000" rows="2">${esc(data.internalNote ?? '')}</textarea></label><div class="admin-actions"><button class="btn secondary" data-save-note="${esc(order.id)}">Guardar nota</button><button class="btn danger" data-delete-order="${esc(order.id)}">Eliminar pedido</button></div><p class="fine">Confirmar o completar una solicitud no descuenta inventario automáticamente. Actualiza el stock del producto al cerrar la venta.</p></article>`;
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
    paymentLabel(data.payment?.method),
    paymentStatusLabel(data.payment?.status),
    receiptChannelLabel(data.payment),
  ]);
}

async function updateOrder(id, changes) {
  await request('/api/admin/orders', 'PATCH', { id, ...changes });
  const order = admin.dashboard.orders.find((o) => o.id === id);
  if ('status' in changes) order.status = changes.status;
  if ('note' in changes) order.data.internalNote = changes.note;
}

function bindList(list) {
  list.querySelectorAll('[data-review-payment]').forEach((button) => {
    button.onclick = async () => {
      const id = button.dataset.reviewPayment;
      const status = button.dataset.paymentStatus;
      if (
        status === 'verified' &&
        !window.confirm(
          '¿Comprobaste el abono en la cuenta oficial? Se registrará el pago como validado.',
        )
      )
        return;
      const buttons = list.querySelectorAll(`[data-review-payment="${CSS.escape(id)}"]`);
      buttons.forEach((item) => {
        item.disabled = true;
      });
      try {
        const { payment } = await request(`/api/admin/orders/${id}/payment`, 'PATCH', { status });
        admin.dashboard.orders.find((order) => order.id === id).data.payment = payment;
        drawList(list.parentElement);
        notify('Revisión de pago guardada');
      } catch (error) {
        notify(error.message);
      } finally {
        buttons.forEach((item) => {
          item.disabled = false;
        });
      }
    };
  });
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
  list.querySelectorAll('[data-delete-order]').forEach((button) => {
    button.onclick = () => removeOrder(button.dataset.deleteOrder);
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

async function removeOrder(id) {
  const question = `¿Eliminar el pedido ${id}? Se borran también los datos del cliente y no se puede deshacer.`;
  if (!window.confirm(question)) return;
  try {
    await request(`/api/admin/orders/${id}`, 'DELETE');
    admin.dashboard.orders = admin.dashboard.orders.filter((o) => o.id !== id);
    notify('Pedido eliminado');
    admin.redraw();
  } catch (error) {
    notify(error.message);
  }
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
