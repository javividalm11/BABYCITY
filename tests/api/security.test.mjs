import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { loadConfig } from '../../src/config.js';
import { ensureAdmin } from '../../src/security/admin-bootstrap.js';
import { ADMIN, createTestApp } from '../helpers/test-app.mjs';

let t;
let cookie;
before(async () => {
  t = createTestApp();
  cookie = (await t.login()).cookie;
});
after(() => t.close());

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

test('toda respuesta lleva las cabeceras de seguridad', async () => {
  for (const route of ['/', '/tienda', '/api/products', '/styles.css', '/no-existe']) {
    const { headers } = await t.call(route);
    assert.match(headers.get('content-security-policy'), /default-src 'none'/);
    assert.match(headers.get('content-security-policy'), /frame-ancestors 'none'/);
    assert.match(headers.get('content-security-policy'), /upgrade-insecure-requests/);
    assert.equal(headers.get('x-frame-options'), 'DENY');
    assert.equal(headers.get('x-content-type-options'), 'nosniff');
    assert.equal(headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    assert.match(headers.get('permissions-policy'), /camera=\(\)/);
    assert.equal(headers.get('cross-origin-opener-policy'), 'same-origin');
    assert.match(headers.get('strict-transport-security'), /max-age=31536000/);
  }
  const api = await t.call('/api/products');
  assert.equal(api.headers.get('cache-control'), 'no-store');
  assert.match(api.headers.get('x-robots-tag'), /noindex/);
});

test('las escrituras exigen origen del mismo sitio y JSON', async () => {
  const write = (options) => t.call('/api/leads', { method: 'POST', ...options });
  const lead = { name: 'Test Customer', phone: '999123456', consent: true, message: 'Hola' };
  assert.equal((await write({ data: lead, origin: null })).status, 403);
  assert.equal((await write({ data: lead, origin: 'https://evil.example' })).status, 403);
  assert.equal(
    (await write({ data: lead, origin: null, headers: { 'Sec-Fetch-Site': 'same-origin' } }))
      .status,
    201,
  );
  assert.equal(
    (await write({ data: lead, origin: null, headers: { 'Sec-Fetch-Site': 'cross-site' } })).status,
    403,
  );
  const form = await write({ data: 'name=x', headers: { 'Content-Type': 'text/plain' } });
  assert.equal(form.status, 415);
  assert.equal((await write({ data: '[]' })).status, 400);
  assert.equal((await write({ data: '{roto' })).status, 400);
  const huge = await write({ data: JSON.stringify({ message: 'x'.repeat(2_100_000) }) });
  assert.equal(huge.status, 413);
});

test('las rutas de administración rechazan peticiones sin sesión', async () => {
  const routes = [
    ['GET', '/api/admin/dashboard'],
    ['POST', '/api/admin/images'],
    ['POST', '/api/admin/products'],
    ['PUT', '/api/admin/products'],
    ['PUT', '/api/admin/settings'],
    ['PATCH', '/api/admin/orders'],
    ['POST', '/api/admin/logout'],
  ];
  for (const [method, route] of routes) {
    const res = await t.call(route, { method, data: method === 'GET' ? undefined : {} });
    assert.equal(res.status, 401, `${method} ${route}`);
  }
  const forged = await t.call('/api/admin/dashboard', { cookie: 'bc_session=' + 'a'.repeat(64) });
  assert.equal(forged.status, 401);
});

test('la cookie de sesión es HttpOnly, SameSite=Strict y Secure', async () => {
  const { res } = await t.login(ADMIN, '198.51.100.20');
  const cookieHeader = res.headers.get('set-cookie');
  assert.match(cookieHeader, /HttpOnly/);
  assert.match(cookieHeader, /SameSite=Strict/);
  assert.match(cookieHeader, /Secure/);
  assert.match(cookieHeader, /Path=\//);
});

test('cerrar sesión invalida el token', async () => {
  const { cookie: own } = await t.login(ADMIN, '198.51.100.21');
  assert.equal((await t.call('/api/admin/dashboard', { cookie: own })).status, 200);
  assert.equal((await t.call('/api/admin/logout', { method: 'POST', cookie: own })).status, 200);
  assert.equal((await t.call('/api/admin/dashboard', { cookie: own })).status, 401);
});

test('cambiar la clave del administrador cierra todas las sesiones', async () => {
  const { cookie: own } = await t.login(ADMIN, '198.51.100.22');
  const config = loadConfig({
    ADMIN_USER: ADMIN.username,
    ADMIN_PASSWORD: 'otra-clave-muy-larga-99',
  });
  await ensureAdmin(t.repo, config);
  assert.equal((await t.call('/api/admin/dashboard', { cookie: own })).status, 401);
  const old = await t.login(ADMIN, '198.51.100.23');
  assert.equal(old.res.status, 401);
  await ensureAdmin(
    t.repo,
    loadConfig({ ADMIN_USER: ADMIN.username, ADMIN_PASSWORD: ADMIN.password }),
  );
  assert.equal((await t.login(ADMIN, '198.51.100.24')).res.status, 200);
});

test('el inicio de sesión limita intentos por IP y por usuario', async () => {
  const bad = { username: 'otro-usuario', password: 'incorrecta' };
  let last;
  for (let i = 0; i < 11; i++) last = await t.login(bad, '192.0.2.50');
  assert.equal(last.res.status, 429);
  const other = createTestApp();
  let status;
  for (let i = 0; i < 12; i++) {
    status = (await other.login({ username: 'victima', password: 'x' }, `192.0.2.${100 + i}`)).res
      .status;
  }
  assert.equal(status, 429);
  other.close();
});

test('las imágenes se validan por su contenido y se sirven con tipo correcto', async () => {
  const { cookie } = await t.login(ADMIN, '198.51.100.30');
  const upload = (payload) =>
    t.call('/api/admin/images', { method: 'POST', data: payload, cookie });
  const ok = await upload({ base64: PNG.toString('base64') });
  assert.equal(ok.status, 201);
  assert.match(ok.data.image, /^\/assets\/uploads\/[a-f0-9]{32}\.png$/);
  const served = await t.call(ok.data.image);
  assert.equal(served.status, 200);
  assert.equal(served.headers.get('content-type'), 'image/png');
  assert.equal(
    (await upload({ base64: Buffer.from('<svg onload=alert(1)>').toString('base64') })).status,
    400,
  );
  assert.equal((await upload({ base64: 'no es base64 !!' })).status, 400);
  assert.equal((await upload({ base64: 5 })).status, 400);
  assert.equal((await upload({ base64: 'A'.repeat(1_600_000) })).status, 400);
});

test('no se puede salir de las carpetas públicas', async () => {
  const attempts = [
    '/assets/uploads/..%2f..%2fpackage.json',
    '/assets/uploads/../../package.json',
    '/catalogo/..%2fpackage.json',
    '/catalogo/%2e%2e/package.json',
    '/..%2fpackage.json',
    '/%2e%2e/package.json',
    '/.git/config',
    '/vendor/..%2f..%2fpackage.json',
    '/robots.txt%00.png',
  ];
  for (const route of attempts) {
    const res = await t.call(route);
    assert.ok(
      [403, 404].includes(res.status) || res.headers.get('content-type')?.includes('html'),
      route,
    );
    assert.ok(!String(res.data).includes('"name": "babycity"'), route);
  }
});

test('métodos y rutas desconocidos responden sin filtrar detalles', async () => {
  assert.equal((await t.call('/api/no-existe')).status, 404);
  assert.equal((await t.call('/api/products', { method: 'DELETE' })).status, 405);
  assert.equal((await t.call('/styles.css', { method: 'POST', data: {} })).status, 405);
  const head = await t.call('/api/products', { method: 'HEAD' });
  assert.equal(head.status, 200);
});
