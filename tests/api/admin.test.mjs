import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { ADMIN, createTestApp } from '../helpers/test-app.mjs';

let t;
let cookie;
before(async () => {
  t = createTestApp();
  cookie = (await t.login(ADMIN, '198.51.100.40')).cookie;
});
after(() => t.close());

const admin = (route, options = {}) => t.call(route, { cookie, ...options });
const customer = { name: 'Test Customer', phone: '999123456', consent: true };

async function createOrder() {
  const order = { ...customer, delivery: 'pickup', items: [{ id: 1, quantity: 1 }] };
  return (await t.call('/api/orders', { method: 'POST', data: order })).data;
}

test('las rutas nuevas exigen sesión', async () => {
  const attempts = [
    ['GET', '/api/admin/activity'],
    ['DELETE', '/api/admin/products/1'],
    ['PATCH', '/api/admin/records'],
  ];
  for (const [method, route] of attempts) {
    const res = await t.call(route, { method, data: method === 'GET' ? undefined : {} });
    assert.equal(res.status, 401, `${method} ${route}`);
  }
});

test('la sesión caduca por inactividad y se renueva con el uso', async () => {
  const { cookie: own } = await t.login(ADMIN, '198.51.100.41');
  const before = t.repo.db.prepare('SELECT idle_expires FROM admin_sessions').all();
  assert.equal((await t.call('/api/admin/dashboard', { cookie: own })).status, 200);
  const after = t.repo.db.prepare('SELECT idle_expires FROM admin_sessions').all();
  assert.ok(
    Math.max(...after.map((r) => r.idle_expires)) >= Math.max(...before.map((r) => r.idle_expires)),
  );
  t.repo.db.prepare('UPDATE admin_sessions SET idle_expires = ?').run(Date.now() - 1000);
  assert.equal((await t.call('/api/admin/dashboard', { cookie: own })).status, 401);
  const fresh = await t.login(ADMIN, '198.51.100.42');
  assert.equal((await t.call('/api/admin/dashboard', { cookie: fresh.cookie })).status, 200);
  cookie = fresh.cookie;
});

test('la sesión tiene un tope absoluto aunque se use sin parar', async () => {
  const { cookie: own } = await t.login(ADMIN, '198.51.100.43');
  t.repo.db.prepare('UPDATE admin_sessions SET absolute_expires = ?').run(Date.now() - 1000);
  assert.equal((await t.call('/api/admin/dashboard', { cookie: own })).status, 401);
  cookie = (await t.login(ADMIN, '198.51.100.44')).cookie;
});

test('el registro de actividad guarda quién hizo qué, sin IP completa', async () => {
  await t.login({ username: 'tester', password: 'incorrecta' }, '203.0.113.77');
  const { data } = await admin('/api/admin/activity');
  const failed = data.find((entry) => entry.action === 'login.fallido');
  assert.ok(failed);
  assert.equal(failed.detail, 'Origen 203.0.113.x');
  assert.ok(data.some((entry) => entry.action === 'login' && entry.actor === 'tester'));
  assert.ok(data[0].id > data[data.length - 1].id);
});

test('eliminar un producto lo quita de la tienda y queda registrado', async () => {
  const before = (await t.call('/api/products')).data.length;
  assert.equal((await admin('/api/admin/products/50', { method: 'DELETE' })).status, 200);
  assert.equal((await t.call('/api/products')).data.length, before - 1);
  assert.equal((await admin('/api/admin/products/50', { method: 'DELETE' })).status, 404);
  assert.equal((await admin('/api/admin/products/abc', { method: 'DELETE' })).status, 404);
  const { data } = await admin('/api/admin/activity');
  assert.ok(data.some((entry) => entry.action === 'producto.eliminar' && entry.target === '#50'));
});

test('un pedido se elimina por su código y queda registrado', async () => {
  const order = await createOrder();
  const route = `/api/admin/orders/${order.id}`;
  assert.equal((await t.call(route, { method: 'DELETE' })).status, 401);
  assert.equal((await admin('/api/admin/orders/BC-NOEXISTE1', { method: 'DELETE' })).status, 404);
  assert.equal((await admin('/api/admin/orders/abc', { method: 'DELETE' })).status, 404);
  assert.equal((await admin(route, { method: 'DELETE' })).status, 200);
  assert.equal((await admin(route, { method: 'DELETE' })).status, 404);
  const { data } = await admin('/api/admin/dashboard');
  assert.ok(!data.orders.some((o) => o.id === order.id));
  const log = (await admin('/api/admin/activity')).data;
  assert.ok(log.some((e) => e.action === 'pedido.eliminar' && e.target === order.id));
});

test('las notas internas y el estado de un pedido se guardan por separado', async () => {
  const order = await createOrder();
  const patch = (data) => admin('/api/admin/orders', { method: 'PATCH', data });
  assert.equal((await patch({ id: order.id })).status, 400);
  assert.equal((await patch({ id: order.id, note: 5 })).status, 400);
  assert.equal((await patch({ id: 'BC-NOEXISTE', note: 'hola' })).status, 404);
  assert.equal((await patch({ id: order.id, note: 'Llamar por la tarde' })).status, 200);
  assert.equal((await patch({ id: order.id, status: 'confirmado' })).status, 200);
  assert.equal((await patch({ id: order.id, note: 'x'.repeat(1500) })).status, 200);
  const saved = (await admin('/api/admin/dashboard')).data.orders.find((o) => o.id === order.id);
  assert.equal(saved.status, 'confirmado');
  assert.equal(saved.data.internalNote.length, 1000);
  assert.equal(saved.data.customer.name, 'Test Customer');
});

test('consultas y reclamos se pueden marcar como atendidos', async () => {
  await t.call('/api/leads', { method: 'POST', data: { ...customer, message: 'Hola' } });
  const { data } = await admin('/api/admin/dashboard');
  const lead = data.leads[0];
  const patch = (body) => admin('/api/admin/records', { method: 'PATCH', data: body });
  assert.equal((await patch({ kind: 'lead', id: lead.id, handled: true })).status, 200);
  let saved = (await admin('/api/admin/dashboard')).data.leads[0];
  assert.equal(saved.data.handled, true);
  assert.match(saved.data.handledAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(saved.data.message, 'Hola');
  assert.equal((await patch({ kind: 'lead', id: lead.id, handled: false })).status, 200);
  saved = (await admin('/api/admin/dashboard')).data.leads[0];
  assert.equal(saved.data.handled, false);
  assert.equal(saved.data.handledAt, null);
  assert.equal((await patch({ kind: 'orders', id: lead.id, handled: true })).status, 400);
  assert.equal((await patch({ kind: 'lead', id: lead.id, handled: 'si' })).status, 400);
  assert.equal((await patch({ kind: 'claim', id: 'REC-NOEXISTE', handled: true })).status, 404);
});
