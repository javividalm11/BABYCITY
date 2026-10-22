import { ORDER_STATUSES } from '../constants.js';
import { decodeBase64, detectImageType, IMAGE_MIME } from '../domain/images.js';
import { parseProduct, parseSettings, text } from '../domain/validation.js';
import { fail } from '../http/errors.js';
import { json } from '../http/responses.js';
import { randomHex } from '../security/crypto.js';
import { verifyPassword } from '../security/passwords.js';
import { enforceRateLimit } from '../security/rate-limit.js';
import { clearedCookie, endSession, sessionCookie, startSession } from '../security/sessions.js';

const MAX_LOGIN_ATTEMPTS = 10;

async function login({ repo, config, url, body }) {
  const data = await body();
  const username = text(data.username, 100);
  await enforceRateLimit(repo, `user:${username.toLowerCase()}:login`, MAX_LOGIN_ATTEMPTS);
  const admin = await repo.findAdmin(username);
  if (!(await verifyPassword(data.password ?? '', admin))) {
    throw fail(401, 'Usuario o contraseña incorrectos.');
  }
  const token = await startSession(repo, config.sessionTtlMs);
  const cookie = sessionCookie(config.cookieName, token, config.sessionTtlMs, url);
  return json(200, { ok: true }, { 'Set-Cookie': cookie });
}

async function logout({ repo, request, config, url }) {
  await endSession(repo, request, config.cookieName);
  return json(200, { ok: true }, { 'Set-Cookie': clearedCookie(config.cookieName, url) });
}

async function dashboard({ repo }) {
  const [products, settings, orders, leads, claims] = await Promise.all([
    repo.listProducts(),
    repo.getSettings(),
    repo.listOrders(),
    repo.listLeads(),
    repo.listClaims(),
  ]);
  return json(200, { products, settings, orders, leads, claims });
}

async function uploadImage({ files, config, body }) {
  const { base64 } = await body();
  if (typeof base64 !== 'string' || base64.length > config.maxImageBytes * 1.5) {
    throw fail(400, 'Imagen demasiado grande (máximo 1 MB).');
  }
  const bytes = decodeBase64(base64);
  const type = bytes && detectImageType(bytes);
  if (!type || bytes.length > config.maxImageBytes) {
    throw fail(400, 'Usa una imagen PNG, JPG o WebP de hasta 1 MB.');
  }
  const name = `${randomHex(16)}.${type}`;
  await files.put(`uploads/${name}`, bytes, IMAGE_MIME[type]);
  return json(201, { image: `/assets/uploads/${name}` });
}

async function createProduct({ repo, body }) {
  const id = await repo.nextProductId();
  const product = parseProduct(await body(), id);
  await repo.saveProduct(product);
  return json(200, product);
}

async function updateProduct({ repo, body }) {
  const data = await body();
  const id = data.id;
  if (!Number.isInteger(id) || !(await repo.getProduct(id)))
    throw fail(404, 'Producto no encontrado.');
  const product = parseProduct(data, id);
  await repo.saveProduct(product);
  return json(200, product);
}

async function updateSettings({ repo, body }) {
  await repo.saveSettings(parseSettings(await body()));
  return json(200, { ok: true });
}

async function updateOrderStatus({ repo, body }) {
  const data = await body();
  if (!ORDER_STATUSES.includes(data.status)) throw fail(400, 'Estado inválido.');
  if (!(await repo.setOrderStatus(text(data.id, 50), data.status))) {
    throw fail(404, 'Pedido no encontrado.');
  }
  return json(200, { ok: true });
}

export const adminApiRoutes = [
  { method: 'POST', path: '/api/admin/login', limit: { bucket: 'login', max: 10 }, handler: login },
  { method: 'POST', path: '/api/admin/logout', admin: true, handler: logout },
  { method: 'GET', path: '/api/admin/dashboard', admin: true, handler: dashboard },
  { method: 'POST', path: '/api/admin/images', admin: true, handler: uploadImage },
  { method: 'POST', path: '/api/admin/products', admin: true, handler: createProduct },
  { method: 'PUT', path: '/api/admin/products', admin: true, handler: updateProduct },
  { method: 'PUT', path: '/api/admin/settings', admin: true, handler: updateSettings },
  { method: 'PATCH', path: '/api/admin/orders', admin: true, handler: updateOrderStatus },
];
