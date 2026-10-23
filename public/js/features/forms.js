import { $, downloadText } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { api } from '../lib/api.js';
import { esc, money } from '../lib/format.js';
import { notify } from '../lib/notify.js';
import { cart, clearCart } from '../state/store.js';
import { navigate } from './navigation.js';
import { renderOrderSuccess } from '../components/checkout-content.js';

const FORM_IDS = [
  'checkoutForm',
  'contactForm',
  'contactPageForm',
  'searchForm',
  'navbarSearchForm',
  'shopSearch',
  'claimForm',
];
const SEARCH_FORMS = ['searchForm', 'shopSearch', 'navbarSearchForm'];
const WHATSAPP = 'https://wa.me/51937473120';
const DELIVERY_LABEL = {
  pickup: 'Recojo en tienda',
  lima: 'Envío a Lima',
  province: 'Envío a provincias',
};

function orderMessage(order) {
  const lines = order.items.map((i) => `${i.quantity} × ${i.name}: ${money(i.price * i.quantity)}`);
  return [
    `Hola BabyCity, quiero coordinar mi solicitud ${order.id}.`,
    ...lines,
    `Subtotal: ${money(order.subtotal)}`,
    `Envío: ${order.shipping === null ? 'por cotizar' : money(order.shipping)}`,
    order.total === null ? 'Total pendiente de envío' : `Total: ${money(order.total)}`,
    `Nombre: ${order.customer.name}`,
    `Celular: ${order.customer.phone}`,
    `Entrega: ${DELIVERY_LABEL[order.delivery]}`,
    `Dirección: ${order.customer.address || 'Recojo'}`,
    order.notes,
  ].join('\n');
}

async function submitCheckout(fields) {
  const items = cart.map((i) => ({ id: i.id, quantity: i.quantity }));
  const order = await api('/api/orders', 'POST', { ...fields, items });
  clearCart();
  const link = `${WHATSAPP}?text=${encodeURIComponent(orderMessage(order))}`;
  $('#cartContent').innerHTML = renderOrderSuccess(order, link);
  $('#cartDialog').scrollTop = 0;
}

async function submitContact(fields, form, status) {
  if (fields.category) fields.message = `${fields.category}: ${fields.message}`;
  await api('/api/leads', 'POST', fields);
  const text = `Hola BabyCity. Soy ${fields.name} (${fields.phone}). ${fields.message}`;
  status.innerHTML = `Tu consulta quedó registrada. <a class="text-link" target="_blank" rel="noopener noreferrer" href="${WHATSAPP}?text=${encodeURIComponent(text)}">Abrir WhatsApp y enviar ↗</a>`;
  form.reset();
}

async function submitClaim(fields, form) {
  const { id } = await api('/api/claims', 'POST', fields);
  const receipt = {
    ...fields,
    id,
    created: new Date().toISOString(),
    business: 'GRUPO BABY STORE S.A.C. · RUC 20614491036',
  };
  form.innerHTML = `<div class="success">${icon('check')}<h2>Tu registro fue recibido.</h2><p>Constancia <strong>${esc(id)}</strong>. Conserva este código. Te responderemos a ${esc(fields.email)}.</p><button type="button" class="btn primary" id="downloadReceipt">Descargar mi constancia ↓</button></div>`;
  $('#downloadReceipt').onclick = () => {
    const body = Object.entries(receipt)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n\n');
    downloadText(
      `${id}.txt`,
      `LIBRO DE RECLAMACIONES — BABYCITY\n\n${body}`,
      'text/plain;charset=utf-8',
    );
  };
}

async function onSubmit(e) {
  const form = e.target;
  if (!FORM_IDS.includes(form.id)) return;
  e.preventDefault();
  const fields = Object.fromEntries(new FormData(form));
  if (form.id === 'navbarSearchForm' && !fields.q.trim()) return $('#searchDialog').showModal();
  if (SEARCH_FORMS.includes(form.id)) return navigate('/tienda?q=' + encodeURIComponent(fields.q));
  fields.consent = form.elements.consent?.checked === true;
  const status = form.querySelector('.form-status');
  const submit = form.querySelector('button[type=submit],button:not([type])');
  if (submit) submit.disabled = true;
  if (status) {
    status.classList.remove('error');
    status.textContent = 'Guardando…';
  }
  try {
    if (form.id === 'checkoutForm') await submitCheckout(fields);
    else if (form.id === 'contactForm' || form.id === 'contactPageForm')
      await submitContact(fields, form, status);
    else await submitClaim(fields, form);
  } catch (error) {
    if (status) {
      status.classList.add('error');
      status.textContent = error.message;
    } else notify(error.message);
  } finally {
    if (submit?.isConnected) submit.disabled = false;
  }
}

export function bindForms() {
  document.addEventListener('submit', onSubmit);
}
