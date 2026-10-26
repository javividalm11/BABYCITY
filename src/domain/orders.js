import { DELIVERY_METHODS } from '../constants.js';
import { fail } from '../http/errors.js';
import { parseCustomer, round2, text } from './validation.js';
import { PAYMENT_METHODS } from '../../public/js/content/payment-methods.js';

const MAX_LINES = 50;
const MAX_QUANTITY = 99;

async function priceLine(repo, line) {
  const product = await repo.getProduct(Number(line.id));
  const quantity = line.quantity;
  const invalidQuantity = !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY;
  const unavailable =
    !product || !product.active || (product.stock !== null && product.stock < quantity);
  if (invalidQuantity || unavailable) {
    throw fail(409, 'La disponibilidad cambió. Actualiza tu carrito.');
  }
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    quantity,
    stockConfirmed: product.stock !== null,
  };
}

// Calculo importes con precios y tarifas del servidor; nunca con los del navegador.
export async function quoteOrder(repo, data) {
  const customer = parseCustomer(data);
  // Compatibilidad con solicitudes anteriores que aún no enviaban una preferencia.
  const paymentMethod = data.paymentMethod === undefined ? 'coordinate' : data.paymentMethod;
  if (!PAYMENT_METHODS.some((method) => method.id === paymentMethod)) {
    throw fail(400, 'Selecciona un medio de pago oficial.');
  }
  if (!DELIVERY_METHODS.includes(data.delivery)) throw fail(400, 'Selecciona la entrega.');
  if (data.delivery !== 'pickup' && !customer.address) {
    throw fail(400, 'Indica la dirección y ciudad de entrega.');
  }
  const lines = data.items;
  if (!Array.isArray(lines) || !lines.length || lines.length > MAX_LINES) {
    throw fail(400, 'Tu carrito está vacío o supera 50 productos.');
  }
  const seen = new Set();
  const items = [];
  for (const line of lines) {
    if (seen.has(line.id)) throw fail(400, 'Producto duplicado.');
    seen.add(line.id);
    items.push(await priceLine(repo, line));
  }
  const subtotal = round2(items.reduce((sum, i) => sum + i.price * i.quantity, 0));
  const shipping = data.delivery === 'pickup' ? 0 : (await repo.getSettings())[data.delivery];
  return {
    customer,
    items,
    subtotal,
    shipping,
    total: shipping === null ? null : round2(subtotal + shipping),
    delivery: data.delivery,
    notes: text(data.notes, 700),
    // El cliente solo elige el medio; nunca puede acreditar un pago desde el navegador.
    payment: { method: paymentMethod, status: 'pending_verification' },
  };
}
