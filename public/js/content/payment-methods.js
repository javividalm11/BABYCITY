// Datos públicos del comercio. Compartidos por el servidor y la tienda.
export const PAYMENT_BUSINESS = Object.freeze({
  name: 'GRUPO BABY STORE S.A.C.',
  ruc: '20614491036',
});

export const PAYMENT_METHODS = Object.freeze([
  Object.freeze({ id: 'yape', label: 'Yape Empresas', phone: '913 205 364' }),
  Object.freeze({
    id: 'bcp',
    label: 'Transferencia BCP en soles',
    account: '1947227359024',
    cci: '00219400722735902499',
  }),
  Object.freeze({ id: 'coordinate', label: 'Coordinar el pago con un asesor' }),
]);

export const paymentLabel = (method) =>
  PAYMENT_METHODS.find((item) => item.id === method)?.label ?? 'Por coordinar';

export const PAYMENT_STATUS_LABELS = Object.freeze({
  pending_verification: 'Pendiente de verificación',
  verified: 'Pago validado',
  rejected: 'Comprobante rechazado',
});

export const paymentStatusLabel = (status) =>
  PAYMENT_STATUS_LABELS[status] ?? 'Sin registro de pago';

export const receiptChannelLabel = (payment) => {
  if (payment?.receiptChannel === 'whatsapp')
    return 'El cliente eligió enviar el comprobante por WhatsApp';
  if (payment?.receiptChannel === 'upload' || payment?.receipt)
    return 'Comprobante subido al panel';
  return 'Canal de comprobante sin registrar';
};
