import { quoteOrder } from '../domain/orders.js';
import { parseClaim, parseLead } from '../domain/validation.js';
import { json } from '../http/responses.js';
import { randomHex } from '../security/crypto.js';

const now = () => new Date().toISOString();

async function listProducts({ repo }) {
  const products = await repo.listProducts();
  return json(
    200,
    products.filter((p) => p.active),
  );
}

async function getSettings({ repo }) {
  return json(200, await repo.getSettings());
}

// Una solicitud no reserva ni descuenta stock; el administrador confirma la disponibilidad.
async function createOrder({ repo, body }) {
  const order = await quoteOrder(repo, await body());
  const id = `BC-${randomHex(5).toUpperCase()}`;
  await repo.addOrder(id, now(), 'solicitud', order);
  return json(201, { id, ...order });
}

async function createLead({ repo, body }) {
  const lead = parseLead(await body());
  await repo.addLead(randomHex(12), now(), lead);
  return json(201, { ok: true });
}

async function createClaim({ repo, body }) {
  const claim = parseClaim(await body());
  const id = `REC-${randomHex(6).toUpperCase()}`;
  await repo.addClaim(id, now(), claim);
  return json(201, { id });
}

export const publicApiRoutes = [
  { method: 'GET', path: '/api/products', handler: listProducts },
  { method: 'GET', path: '/api/settings', handler: getSettings },
  {
    method: 'POST',
    path: '/api/orders',
    limit: { bucket: 'order', max: 30 },
    handler: createOrder,
  },
  { method: 'POST', path: '/api/leads', limit: { bucket: 'lead', max: 20 }, handler: createLead },
  {
    method: 'POST',
    path: '/api/claims',
    limit: { bucket: 'claim', max: 15 },
    handler: createClaim,
  },
];
