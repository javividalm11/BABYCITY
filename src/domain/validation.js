import { PRIVACY_VERSION } from '../constants.js';
import { fail } from '../http/errors.js';

const PHONE = /^\+?[0-9\s-]{9,18}$/;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
const PRODUCT_IMAGE = /^\/assets\/[\w/.-]+\.(webp|png|jpg|jpeg)$/;

export const round2 = (n) => Math.round(n * 100) / 100;

// Devuelvo un texto recortado; cualquier otro tipo se descarta.
export const text = (value, max = 200) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

export function parseCustomer(data) {
  const name = text(data.name, 120);
  const phone = text(data.phone, 20);
  const email = text(data.email, 160);
  if (name.length < 2 || !PHONE.test(phone) || data.consent !== true) {
    throw fail(400, 'Completa nombre, celular y autorización de privacidad.');
  }
  if (email && !EMAIL.test(email)) throw fail(400, 'Revisa el correo electrónico.');
  return {
    name,
    phone,
    email,
    address: text(data.address, 300),
    consent: true,
    consentVersion: PRIVACY_VERSION,
  };
}

export function parseProduct(data, id) {
  const stock = data.stock;
  const price = data.price;
  const valid =
    text(data.name, 180) &&
    text(data.category, 80) &&
    typeof price === 'number' &&
    Number.isFinite(price) &&
    price >= 0 &&
    price <= 100_000 &&
    (stock === null || (Number.isInteger(stock) && stock >= 0 && stock <= 100_000));
  if (!valid) throw fail(400, 'Revisa nombre, categoría, precio y stock.');
  const image = text(data.image, 500);
  if (!PRODUCT_IMAGE.test(image) || image.includes('..')) {
    throw fail(400, 'Selecciona una imagen de la biblioteca.');
  }
  return {
    id,
    sku: text(data.sku, 60) || `BC-${String(id).padStart(4, '0')}`,
    name: text(data.name, 180),
    category: text(data.category, 80),
    price: round2(price),
    stock,
    active: data.active !== false,
    image,
    description: text(data.description, 3000),
    catalogId: text(data.catalogId, 40),
    sourcePage: Number.isInteger(data.sourcePage) ? data.sourcePage : null,
  };
}

export function parseSettings(data) {
  for (const key of ['lima', 'province']) {
    const fee = data[key];
    if (
      fee !== null &&
      (typeof fee !== 'number' || !Number.isFinite(fee) || fee < 0 || fee > 10_000)
    ) {
      throw fail(400, 'Tarifa inválida.');
    }
  }
  return { lima: data.lima, province: data.province };
}

export function parseLead(data) {
  const customer = parseCustomer(data);
  const message = text(data.message, 1000);
  if (!message) throw fail(400, 'Escribe tu consulta.');
  return { ...customer, message };
}

export function parseClaim(data) {
  const customer = parseCustomer(data);
  const claim = {
    ...customer,
    type: data.type,
    document: text(data.document, 30),
    detail: text(data.detail, 3000),
    request: text(data.request, 2000),
    product: text(data.product, 200),
  };
  const complete =
    claim.detail &&
    claim.request &&
    claim.document &&
    ['reclamo', 'queja'].includes(claim.type) &&
    customer.email &&
    customer.address;
  if (!complete) throw fail(400, 'Completa todos los datos de tu reclamación.');
  return claim;
}
