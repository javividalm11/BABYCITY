import { MIN_ADMIN_PASSWORD, ORDER_STATUSES } from '../constants.js';
import { audit, maskIp } from '../domain/audit.js';
import { decodeBase64, detectImageType, IMAGE_MIME } from '../domain/images.js';
import { parseProduct, parseSettings, text } from '../domain/validation.js';
import { fail } from '../http/errors.js';
import { json } from '../http/responses.js';
import { randomHex } from '../security/crypto.js';
import { createCredentials, verifyPassword } from '../security/passwords.js';
import { enforceRateLimit } from '../security/rate-limit.js';
import { clearedCookie, endSession, sessionCookie, startSession } from '../security/sessions.js';

const AUDIT_PAGE = 100;
const MAX_NOTE = 1000;
const MAX_PASSWORD = 200;

async function login({ repo, config, url, body, clientIp }) {
  const data = await body();
  const username = text(data.username, 100);
  await enforceRateLimit(repo, `${clientIp}:login`, config.loginLimit);
  await enforceRateLimit(repo, `user:${username.toLowerCase()}:login`, config.loginLimit);
  const admin = await repo.findAdmin(username);
  if (!(await verifyPassword(data.password ?? '', admin))) {
    await audit(repo, username || 'desconocido', 'login.fallido', '', `Origen ${maskIp(clientIp)}`);
    throw fail(401, 'Usuario o contraseña incorrectos.');
  }
  const token = await startSession(repo, config, username);
  await audit(repo, username, 'login', '', `Origen ${maskIp(clientIp)}`);
  const cookie = sessionCookie(config.cookieName, token, config.sessionTtlMs, url);
  return json(200, { ok: true }, { 'Set-Cookie': cookie });
}

async function logout({ repo, request, config, url, session }) {
  await endSession(repo, request, config.cookieName);
  await audit(repo, session.username, 'logout');
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

async function activity({ repo }) {
  return json(200, await repo.listAudit(AUDIT_PAGE));
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

const describe = (p) => `${p.name} · S/ ${p.price} · stock ${p.stock ?? 'por confirmar'}`;

async function createProduct({ repo, body, session }) {
  const id = await repo.nextProductId();
  const product = parseProduct(await body(), id);
  await repo.saveProduct(product);
  await audit(repo, session.username, 'producto.crear', `#${id}`, describe(product));
  return json(200, product);
}

async function updateProduct({ repo, body, session }) {
  const data = await body();
  const id = data.id;
  if (!Number.isInteger(id) || !(await repo.getProduct(id))) {
    throw fail(404, 'Producto no encontrado.');
  }
  const product = parseProduct(data, id);
  await repo.saveProduct(product);
  await audit(repo, session.username, 'producto.editar', `#${id}`, describe(product));
  return json(200, product);
}

async function deleteProduct({ repo, params, session }) {
  const id = Number(params.id);
  const product = await repo.getProduct(id);
  if (!product || !(await repo.deleteProduct(id))) throw fail(404, 'Producto no encontrado.');
  await audit(repo, session.username, 'producto.eliminar', `#${id}`, product.name);
  return json(200, { ok: true });
}

async function updateSettings({ repo, body, session }) {
  const settings = parseSettings(await body());
  await repo.saveSettings(settings);
  const detail = `Lima ${settings.lima ?? 'por cotizar'} · Provincias ${settings.province ?? 'por cotizar'}`;
  await audit(repo, session.username, 'tarifas.editar', '', detail);
  return json(200, { ok: true });
}

async function updateOrder({ repo, body, session }) {
  const data = await body();
  const id = text(data.id, 50);
  if (!id || (data.status === undefined && data.note === undefined)) {
    throw fail(400, 'Indica qué quieres actualizar.');
  }
  if (data.status !== undefined) {
    if (!ORDER_STATUSES.includes(data.status)) throw fail(400, 'Estado inválido.');
    if (!(await repo.setOrderStatus(id, data.status))) throw fail(404, 'Pedido no encontrado.');
    await audit(repo, session.username, 'pedido.estado', id, data.status);
  }
  if (data.note !== undefined) {
    if (typeof data.note !== 'string') throw fail(400, 'Nota inválida.');
    if (!(await repo.setOrderNote(id, text(data.note, MAX_NOTE)))) {
      throw fail(404, 'Pedido no encontrado.');
    }
    await audit(repo, session.username, 'pedido.nota', id);
  }
  return json(200, { ok: true });
}

async function deleteOrder({ repo, params, session }) {
  if (!(await repo.deleteOrder(params.id))) throw fail(404, 'Pedido no encontrado.');
  await audit(repo, session.username, 'pedido.eliminar', params.id);
  return json(200, { ok: true });
}

async function changePassword({ repo, body, session }) {
  await enforceRateLimit(repo, `user:${session.username.toLowerCase()}:password`, 5);
  const data = await body();
  const current = typeof data.current === 'string' ? data.current : '';
  const next = typeof data.next === 'string' ? data.next : '';
  if (!(await verifyPassword(current, await repo.findAdmin(session.username)))) {
    throw fail(403, 'La contraseña actual no es correcta.');
  }
  const tooShort = next.length < MIN_ADMIN_PASSWORD || next.length > MAX_PASSWORD;
  if (tooShort || next === current || next.toLowerCase() === session.username.toLowerCase()) {
    throw fail(
      400,
      `La nueva contraseña debe tener entre ${MIN_ADMIN_PASSWORD} y ${MAX_PASSWORD} caracteres y ser distinta de la actual.`,
    );
  }
  const { salt, hash } = await createCredentials(next);
  await repo.updatePassword(session.username, salt, hash, session.hash);
  await audit(repo, session.username, 'cuenta.clave', '', 'Se cerraron las demás sesiones');
  return json(200, { ok: true });
}

async function revokeOtherSessions({ repo, session }) {
  const closed = await repo.removeOtherSessions(session.username, session.hash);
  await audit(repo, session.username, 'cuenta.sesiones', '', `Sesiones cerradas: ${closed}`);
  return json(200, { ok: true, closed });
}

async function markHandled({ repo, body, session }) {
  const data = await body();
  const id = text(data.id, 50);
  if (!['lead', 'claim'].includes(data.kind) || typeof data.handled !== 'boolean' || !id) {
    throw fail(400, 'Solicitud inválida.');
  }
  const at = data.handled ? new Date().toISOString() : null;
  if (!(await repo.setHandled(data.kind, id, data.handled, at))) {
    throw fail(404, 'Registro no encontrado.');
  }
  const action = data.kind === 'lead' ? 'consulta' : 'reclamo';
  await audit(repo, session.username, `${action}.atendido`, id, data.handled ? 'Sí' : 'No');
  return json(200, { ok: true, handledAt: at });
}

export const adminApiRoutes = [
  { method: 'POST', path: '/api/admin/login', handler: login },
  { method: 'POST', path: '/api/admin/logout', admin: true, handler: logout },
  { method: 'GET', path: '/api/admin/dashboard', admin: true, handler: dashboard },
  { method: 'GET', path: '/api/admin/activity', admin: true, handler: activity },
  { method: 'POST', path: '/api/admin/images', admin: true, handler: uploadImage },
  { method: 'POST', path: '/api/admin/products', admin: true, handler: createProduct },
  { method: 'PUT', path: '/api/admin/products', admin: true, handler: updateProduct },
  {
    method: 'DELETE',
    path: /^\/api\/admin\/products\/(?<id>\d+)$/,
    admin: true,
    handler: deleteProduct,
  },
  { method: 'PUT', path: '/api/admin/settings', admin: true, handler: updateSettings },
  { method: 'PATCH', path: '/api/admin/orders', admin: true, handler: updateOrder },
  {
    method: 'DELETE',
    path: /^\/api\/admin\/orders\/(?<id>BC-[A-F0-9]{10})$/,
    admin: true,
    handler: deleteOrder,
  },
  { method: 'PATCH', path: '/api/admin/records', admin: true, handler: markHandled },
  { method: 'POST', path: '/api/admin/password', admin: true, handler: changePassword },
  { method: 'POST', path: '/api/admin/sessions/revoke', admin: true, handler: revokeOtherSessions },
];
