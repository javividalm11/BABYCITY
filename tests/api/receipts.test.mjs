import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createTestApp } from '../helpers/test-app.mjs';

const PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
const order = {
  name: 'Cliente con comprobante',
  phone: '987654321',
  consent: true,
  delivery: 'pickup',
  items: [{ id: 2, quantity: 1 }],
  paymentMethod: 'yape',
  receiptBase64: PNG,
};
let t;
let cookie;
before(async () => {
  t = createTestApp();
  cookie = (await t.login()).cookie;
});
after(() => t.close());
const create = (data = order) => t.call('/api/orders', { method: 'POST', data });

test('persiste el canal elegido y rechaza selecciones incompatibles con el adjunto', async () => {
  const whatsapp = await create({ ...order, receiptBase64: undefined, receiptChannel: 'whatsapp' });
  assert.equal(whatsapp.status, 201);
  assert.equal(whatsapp.data.payment.receiptChannel, 'whatsapp');
  assert.equal(whatsapp.data.payment.receipt, undefined);
  const uploaded = await create({ ...order, receiptChannel: 'upload' });
  assert.equal(uploaded.status, 201);
  assert.equal(uploaded.data.payment.receiptChannel, 'upload');
  assert.equal(uploaded.data.payment.receipt, true);
  for (const data of [
    { ...order, receiptChannel: 'whatsapp' },
    { ...order, receiptChannel: 'upload', receiptBase64: undefined },
    { ...order, receiptChannel: 'email' },
    { ...order, receiptChannel: 'whatsapp', paymentMethod: 'coordinate', receiptBase64: undefined },
  ])
    assert.equal((await create(data)).status, 400);
  const stored = (await t.call('/api/admin/dashboard', { cookie })).data.orders.find(
    (o) => o.id === whatsapp.data.id,
  );
  assert.equal(stored.data.payment.receiptChannel, 'whatsapp');
});

test('el comprobante se guarda privado, no se filtra en respuestas ni en el dashboard', async () => {
  const created = await create();
  assert.equal(created.status, 201);
  assert.equal(created.data.payment.receipt, true);
  assert.equal(created.data.payment.status, 'pending_verification');
  assert.ok(!JSON.stringify(created.data).includes(PNG));
  const url = `/api/admin/orders/${created.data.id}/receipt`;
  assert.equal((await t.call(url)).status, 401);
  assert.equal((await t.call(url, { method: 'HEAD' })).status, 401);
  const file = await t.call(url, { cookie });
  assert.equal(file.status, 200);
  assert.equal(file.headers.get('content-type'), 'image/png');
  assert.equal(file.headers.get('cache-control'), 'no-store');
  assert.equal(file.headers.get('x-content-type-options'), 'nosniff');
  const dashboard = await t.call('/api/admin/dashboard', { cookie });
  assert.ok(!JSON.stringify(dashboard.data).includes(PNG));
  assert.equal((await t.call(`/assets/uploads/${created.data.id}.png`)).status, 404);
});

test('rechaza archivos inválidos, SVG, base64 corrupto, tamaño excesivo y medio incompatible', async () => {
  for (const receiptBase64 of [
    null,
    '',
    123,
    {},
    '!!!',
    Buffer.from('<svg onload="alert(1)"/>').toString('base64'),
    Buffer.alloc(1_048_577).toString('base64'),
  ]) {
    assert.equal((await create({ ...order, receiptBase64 })).status, 400);
  }
  assert.equal((await create({ ...order, paymentMethod: 'coordinate' })).status, 400);
  assert.equal((await create({ ...order, paymentMethod: 'bcp' })).status, 201);
  assert.equal((await create({ ...order, receiptBase64: undefined })).status, 201);
});

test('solo el administrador revisa el abono y se guardan usuario, fecha e historial', async () => {
  const created = await create({
    ...order,
    payment: { status: 'verified', receipt: true, reviewedBy: 'cliente' },
  });
  const id = created.data.id;
  const url = `/api/admin/orders/${id}/payment`;
  const review = (status, options = {}) =>
    t.call(url, { method: 'PATCH', data: { status }, cookie, ...options });
  assert.equal((await review('verified', { cookie: undefined })).status, 401);
  assert.equal((await review('verified', { origin: 'https://evil.example' })).status, 403);
  assert.equal((await review('paid')).status, 400);
  for (const status of ['verified', 'rejected', 'pending_verification']) {
    const result = await review(status);
    assert.equal(result.status, 200);
    assert.equal(result.data.payment.status, status);
    assert.equal(result.data.payment.reviewedBy, 'tester');
    assert.ok(Number.isFinite(Date.parse(result.data.payment.reviewedAt)));
  }
  const stored = (await t.call('/api/admin/dashboard', { cookie })).data.orders.find(
    (o) => o.id === id,
  );
  assert.equal(stored.status, 'solicitud');
  assert.equal(stored.data.payment.status, 'pending_verification');
  const activity = await t.call('/api/admin/activity', { cookie });
  assert.equal(
    activity.data.filter((entry) => entry.action === 'pago.revisar' && entry.target === id).length,
    3,
  );
  const noReceipt = await create({ ...order, receiptBase64: undefined });
  assert.equal(
    (
      await t.call(`/api/admin/orders/${noReceipt.data.id}/payment`, {
        method: 'PATCH',
        data: { status: 'verified' },
        cookie,
      })
    ).status,
    404,
  );
});

test('eliminar el pedido elimina el comprobante y no permite revisarlo después', async () => {
  const { data } = await create();
  assert.equal(
    (await t.call(`/api/admin/orders/${data.id}`, { method: 'DELETE', cookie })).status,
    200,
  );
  assert.equal(await t.repo.getOrderReceipt(data.id), undefined);
  assert.equal((await t.call(`/api/admin/orders/${data.id}/receipt`, { cookie })).status, 404);
  assert.equal(
    (
      await t.call(`/api/admin/orders/${data.id}/payment`, {
        method: 'PATCH',
        data: { status: 'verified' },
        cookie,
      })
    ).status,
    404,
  );
});
