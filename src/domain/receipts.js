import { decodeBase64, detectImageType, IMAGE_MIME } from './images.js';
import { fail } from '../http/errors.js';

export function parseReceiptChannel(channel, method, receipt) {
  // Compatibilidad: no atribuimos una elección de WhatsApp a pedidos antiguos.
  if (channel === undefined) return receipt ? 'upload' : null;
  if (!['yape', 'bcp'].includes(method) || !['whatsapp', 'upload'].includes(channel)) {
    throw fail(400, 'Selecciona cómo enviarás tu comprobante.');
  }
  if (channel === 'upload' && !receipt) throw fail(400, 'Adjunta tu comprobante para continuar.');
  if (channel === 'whatsapp' && receipt) {
    throw fail(400, 'Elige subir el comprobante para adjuntar una imagen.');
  }
  return channel;
}

export function parseReceipt(base64, paymentMethod, maxBytes) {
  if (base64 === undefined) return null;
  if (!['yape', 'bcp'].includes(paymentMethod)) {
    throw fail(400, 'Selecciona Yape o BCP para adjuntar tu comprobante.');
  }
  if (typeof base64 !== 'string' || !base64.length || base64.length > Math.ceil(maxBytes / 3) * 4) {
    throw fail(400, 'Usa un comprobante PNG, JPG o WebP de hasta 1 MB.');
  }
  const bytes = decodeBase64(base64);
  const type = bytes && detectImageType(bytes);
  if (!type || bytes.length > maxBytes) {
    throw fail(400, 'Usa un comprobante PNG, JPG o WebP de hasta 1 MB.');
  }
  return { base64, contentType: IMAGE_MIME[type] };
}
