import { PAYMENT_BUSINESS, PAYMENT_METHODS, paymentLabel } from '../content/payment-methods.js';
import { esc } from '../lib/format.js';
import { icon } from '../lib/icons.js';

function paymentBrand(method) {
  const brands = {
    yape: '<span class="payment-yape-currency">S/</span><span class="payment-yape-word">yape</span>',
    bcp: '<span class="payment-bcp-word"><i>›</i>BCP<i>›</i></span>',
    coordinate: icon('whatsapp'),
  };
  return `<span class="payment-brand payment-brand-${method.id}" aria-hidden="true">${brands[method.id]}</span>`;
}

function methodDetails(method) {
  if (method.id === 'coordinate') return accountDetails(method);
  const account =
    method.id === 'yape'
      ? `<span class="payment-yape-number">${esc(method.phone)}</span>`
      : `<span class="payment-account">Cuenta soles: <b>${esc(method.account)}</b></span><span class="payment-account">CCI BCP: <b>${esc(method.cci)}</b></span>`;
  return `${account}<span class="payment-holder">Titular: ${esc(PAYMENT_BUSINESS.name)}</span>`;
}

function accountDetails(method) {
  if (method.id === 'yape') return `<span class="payment-number">${esc(method.phone)}</span>`;
  if (method.id === 'bcp')
    return `<span>Cuenta soles</span><span class="payment-number">${esc(method.account)}</span><span>CCI BCP</span><span class="payment-number">${esc(method.cci)}</span>`;
  return '<span>Te ayudamos a elegir un medio oficial por WhatsApp.</span>';
}

const businessDetails = () =>
  `<div class="payment-business"><span>Titular / Razón social</span><strong>${esc(PAYMENT_BUSINESS.name)}</strong><span>RUC: ${esc(PAYMENT_BUSINESS.ruc)}</span></div>`;

function renderReceiptUpload() {
  return `<fieldset id="receiptDelivery" class="receipt-upload" hidden><legend>¿Cómo enviarás tu comprobante?</legend><div class="payment-options"><label class="payment-option"><input type="radio" name="receiptChannel" value="whatsapp" checked disabled required><span><strong>Enviar por WhatsApp</strong><span>Envíalo a nuestro equipo con tu código de solicitud después de registrar el pedido.</span></span></label><label class="payment-option"><input type="radio" name="receiptChannel" value="upload" disabled required><span><strong>Subir comprobante</strong><span>Adjunta la captura para que el administrador la revise en el panel.</span></span></label></div><div id="receiptUpload" hidden><label for="paymentReceipt">Adjunta tu comprobante</label><input id="paymentReceipt" name="receipt" type="file" accept="image/png,image/jpeg,image/webp" disabled aria-describedby="receiptHelp"><p class="fine" id="receiptHelp">Captura PNG, JPG o WebP de hasta 1 MB. El administrador la revisará en privado. Adjuntarla no confirma el pago.</p></div></fieldset>`;
}

function receiptConfirmation(payment) {
  if (payment?.receiptChannel === 'whatsapp') {
    return '<p class="receipt-confirmation" role="status">Elegiste enviar tu comprobante por WhatsApp. Abre la conversación y adjunta la captura con tu código de solicitud. El archivo no se envía automáticamente.</p>';
  }
  return payment?.receipt
    ? '<p class="receipt-confirmation" role="status">Comprobante recibido. El administrador verificará el abono; no necesitas enviar nuevamente la captura por WhatsApp.</p>'
    : '';
}

export function renderPaymentMethods() {
  return `<fieldset class="checkout-payments"><legend>Medios de pago <em>oficiales</em></legend><p class="fine" id="paymentHelp">Elige cómo prefieres pagar. Antes de transferir, confirma con nuestro equipo el stock y el total con envío.</p><div class="payment-options payment-method-options">${PAYMENT_METHODS.map((method) => `<label class="payment-option payment-method-option"><input type="radio" name="paymentMethod" value="${method.id}" ${method.id === 'coordinate' ? 'checked' : ''} required aria-describedby="paymentHelp">${paymentBrand(method)}<span class="payment-details"><strong>${esc(method.label)}</strong>${methodDetails(method)}</span><i class="payment-chevron" aria-hidden="true">${icon('chevron')}</i></label>`).join('')}</div><aside class="payment-security"><span class="payment-security-icon" aria-hidden="true">${icon('shield')}</span><div><strong>Paga solo a nuestras cuentas oficiales</strong><p>Verifica que el titular sea ${esc(PAYMENT_BUSINESS.name)}. Si ya pagaste, puedes adjuntar tu comprobante o enviarlo por WhatsApp con tu código de solicitud.</p></div></aside><div class="payment-business-card"><span class="payment-business-icon" aria-hidden="true">${icon('store')}</span><div><span>Titular / Razón social</span><strong>${esc(PAYMENT_BUSINESS.name)}</strong><span>RUC: ${esc(PAYMENT_BUSINESS.ruc)}</span></div></div>${renderReceiptUpload()}</fieldset>`;
}

export function renderPaymentSummary(payment) {
  const method = PAYMENT_METHODS.find((item) => item.id === payment?.method);
  const coordinating = !method || method.id === 'coordinate';
  const account = (label, value) =>
    `<div class="success-account" data-copy-group><span>${label}</span><div><strong data-copy-source>${esc(value)}</strong><button type="button" class="success-copy-number" data-copy-value="${esc(value.replaceAll(' ', ''))}" aria-label="Copiar ${label}">${icon('copy')}</button></div></div>`;
  const details =
    method?.id === 'yape'
      ? account('Número Yape', method.phone)
      : method?.id === 'bcp'
        ? account('Cuenta BCP soles', method.account) + account('CCI BCP', method.cci)
        : '<div class="success-advisor"><strong>Te ayudamos a elegir cómo pagar</strong><p>Conversa con nuestro equipo por WhatsApp para confirmar la disponibilidad, el envío y el medio de pago oficial.</p></div>';
  return `<section class="payment-summary success-payment" aria-label="Pago del pedido">${method ? paymentBrand(method) : ''}<div class="success-payment-body"><div class="success-payment-heading"><h3>${esc(paymentLabel(payment?.method))}</h3><span class="success-payment-status">${icon(coordinating ? 'whatsapp' : 'clock')}${coordinating ? 'Por coordinar' : 'Por verificar'}</span></div>${receiptConfirmation(payment)}<div class="success-payment-details"><div class="success-account-group">${details}</div>${businessDetails()}</div><p class="fine success-payment-note">${coordinating ? 'El pago se coordinará con un asesor.' : 'Pago no verificado. Confirma stock, envío y total antes de pagar. Nuestro equipo comprobará el abono en la cuenta oficial.'}</p></div></section>`;
}
