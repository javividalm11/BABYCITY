import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createTestApp } from '../helpers/test-app.mjs';

let t;
let cookie;
before(async () => {
  t = createTestApp();
  cookie = (await t.login()).cookie;
});
after(() => t.close());

const customer = { name: 'Test Customer', phone: '999123456', consent: true };

test('catálogo inicial: 50 productos y 12 catálogos; archivos privados no se sirven', async () => {
  const products = await t.call('/api/products');
  assert.equal(products.data.length, 50);
  assert.ok(products.data.every((p) => p.stock === null));
  const catalogs = await t.call('/catalogs.json');
  assert.equal(catalogs.data.length, 12);
  assert.equal((await t.call(catalogs.data[0].pages[0])).status, 200);
  assert.equal((await t.call('/Contrato_BabyCity_Servicios_v2.docx')).status, 404);
  assert.equal((await t.call('/data/babycity.sqlite')).status, 404);
});

test('edición de productos validada y protegida', async () => {
  const [product] = (await t.call('/api/products')).data;
  const put = (data) => t.call('/api/admin/products', { method: 'PUT', data, cookie });
  assert.equal((await put({ ...product, stock: -1 })).status, 400);
  assert.equal((await put({ ...product, price: '10' })).status, 400);
  assert.equal((await put({ ...product, image: 'https://evil.test/a.png' })).status, 400);
  assert.equal((await put({ ...product, image: '/assets/../server.png' })).status, 400);
  assert.equal((await put({ ...product, id: 9999 })).status, 404);
  assert.equal((await put({ ...product, stock: 2, price: 123.45 })).status, 200);
  const fresh = (await t.call('/api/products')).data[0];
  assert.equal(fresh.stock, 2);
  assert.equal(fresh.price, 123.45);
});

test('los importes salen del servidor y una solicitud no reserva stock', async () => {
  const order = {
    ...customer,
    delivery: 'pickup',
    items: [{ id: 1, quantity: 2 }],
    subtotal: 1,
    total: 1,
  };
  const post = (data) => t.call('/api/orders', { method: 'POST', data });
  assert.equal((await post({ ...order, consent: false })).status, 400);
  assert.equal((await post({ ...order, email: 'no-es-correo' })).status, 400);
  assert.equal((await post({ ...order, items: [{ id: 1, quantity: 3 }] })).status, 409);
  assert.equal((await post({ ...order, items: [{ id: 1, quantity: 0 }] })).status, 409);
  assert.equal((await post({ ...order, items: [] })).status, 400);
  const created = await post(order);
  assert.equal(created.status, 201);
  assert.equal(created.data.subtotal, 246.9);
  assert.equal(created.data.total, 246.9);
  assert.equal((await t.call('/api/products')).data[0].stock, 2);
  const shipped = await post({ ...order, delivery: 'province', address: 'Calle de prueba, Lima' });
  assert.equal(shipped.data.total, null);
  assert.equal(shipped.data.shipping, null);
  assert.equal((await post({ ...order, delivery: 'province' })).status, 400);
  const dashboard = await t.call('/api/admin/dashboard', { cookie });
  assert.equal(dashboard.data.orders.length, 2);
  const patch = (data) => t.call('/api/admin/orders', { method: 'PATCH', data, cookie });
  assert.equal((await patch({ id: created.data.id, status: 'contactado' })).status, 200);
  assert.equal((await patch({ id: created.data.id, status: 'otro' })).status, 400);
  assert.equal((await patch({ id: 'BC-NOEXISTE', status: 'enviado' })).status, 404);
});

test('las tarifas son autoritativas y no se aceptan líneas duplicadas', async () => {
  const settings = (data) => t.call('/api/admin/settings', { method: 'PUT', data, cookie });
  assert.equal((await settings({ lima: -1, province: null })).status, 400);
  assert.equal((await settings({ lima: 12, province: null })).status, 200);
  const order = {
    ...customer,
    delivery: 'lima',
    address: 'Lima',
    items: [{ id: 1, quantity: 1 }],
  };
  const created = await t.call('/api/orders', { method: 'POST', data: order });
  assert.equal(created.data.total, 135.45);
  const duplicated = await t.call('/api/orders', {
    method: 'POST',
    data: {
      ...order,
      items: [
        { id: 1, quantity: 1 },
        { id: 1, quantity: 1 },
      ],
    },
  });
  assert.equal(duplicated.status, 400);
});

test('medios de pago: valida selección, persiste preferencia e ignora pagos falsificados', async () => {
  const order = { ...customer, delivery: 'pickup', items: [{ id: 2, quantity: 1 }] };
  const post = (data) => t.call('/api/orders', { method: 'POST', data });
  for (const paymentMethod of ['yape', 'bcp', 'coordinate', undefined]) {
    const created = await post({
      ...order,
      paymentMethod,
      payment: { method: 'bcp', status: 'paid' },
      paymentStatus: 'paid',
      total: 0.01,
    });
    assert.equal(created.status, 201);
    assert.deepEqual(created.data.payment, {
      method: paymentMethod ?? 'coordinate',
      status: 'pending_verification',
    });
    assert.notEqual(created.data.total, 0.01);
    const dashboard = await t.call('/api/admin/dashboard', { cookie });
    const stored = dashboard.data.orders.find((o) => o.id === created.data.id);
    assert.deepEqual(stored.data.payment, created.data.payment);
    assert.equal(stored.status, 'solicitud');
  }
  for (const paymentMethod of ['card', '', null, {}, ['yape'], '<script>alert(1)</script>']) {
    assert.equal((await post({ ...order, paymentMethod })).status, 400);
  }
});

test('consultas y reclamos se guardan con consentimiento', async () => {
  const lead = { ...customer, message: 'Consulta' };
  assert.equal((await t.call('/api/leads', { method: 'POST', data: lead })).status, 201);
  assert.equal((await t.call('/api/claims', { method: 'POST', data: lead })).status, 400);
  const claim = await t.call('/api/claims', {
    method: 'POST',
    data: {
      ...lead,
      email: 'test@example.com',
      address: 'Dirección de prueba',
      document: '12345678',
      type: 'reclamo',
      detail: 'Detalle',
      request: 'Solución',
    },
  });
  assert.equal(claim.status, 201);
  assert.match(claim.data.id, /^REC-/);
  const dashboard = await t.call('/api/admin/dashboard', { cookie });
  assert.equal(dashboard.data.claims.length, 1);
});

test('HTML de producto y sitemap incluyen SEO; el contenido se escapa', async () => {
  const page = await t.call('/producto/1');
  assert.match(page.data, /<title>Coche Donna/);
  assert.match(page.data, /application\/ld\+json/);
  assert.match(page.data, /rel="canonical" href="https:\/\/babycity\.example\/producto\/1"/);
  const [product] = (await t.call('/api/products')).data;
  await t.call('/api/admin/products', {
    method: 'PUT',
    data: { ...product, name: '<script>alert(1)</script>' },
    cookie,
  });
  const hostile = await t.call('/producto/1');
  assert.ok(!hostile.data.includes('<script>alert(1)</script>'));
  const sitemap = await t.call('/sitemap.xml');
  assert.equal(sitemap.status, 200);
  assert.match(sitemap.data, /https:\/\/babycity\.example\/producto\/1/);
  assert.match((await t.call('/admin')).data, /noindex/);
});
