import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadConfig } from '../../src/config.js';
import { ensureAdmin } from '../../src/security/admin-bootstrap.js';
import { ADMIN, createTestApp } from '../helpers/test-app.mjs';

const NEW_PASSWORD = 'otra-clave-bien-larga-2026';

// Cada prueba usa su propia aplicación para que los límites de intentos no se mezclen.
async function withApp(work) {
  const app = createTestApp();
  try {
    await work(app);
  } finally {
    app.close();
  }
}

const asAdmin = (app, route, cookie, options = {}) => app.call(route, { cookie, ...options });
const changePassword = (app, cookie, data) =>
  asAdmin(app, '/api/admin/password', cookie, { method: 'POST', data });

test('la sesión pública indica si hay un administrador conectado', () =>
  withApp(async (app) => {
    assert.deepEqual((await app.call('/api/session')).data, { admin: null });
    const { cookie } = await app.login(ADMIN, '198.51.100.60');
    assert.deepEqual((await asAdmin(app, '/api/session', cookie)).data, {
      admin: { username: ADMIN.username },
    });
    const forged = await asAdmin(app, '/api/session', 'bc_session=' + 'a'.repeat(64));
    assert.deepEqual(forged.data, { admin: null });
  }));

test('cambiar la contraseña exige la actual y una nueva válida', () =>
  withApp(async (app) => {
    const { cookie } = await app.login(ADMIN, '198.51.100.61');
    assert.equal((await app.call('/api/admin/password', { method: 'POST', data: {} })).status, 401);
    const attempt = (data) => changePassword(app, cookie, data);
    assert.equal((await attempt({ current: 'incorrecta', next: NEW_PASSWORD })).status, 403);
    assert.equal((await attempt({ current: ADMIN.password, next: 'corta' })).status, 400);
    assert.equal((await attempt({ current: ADMIN.password, next: 5 })).status, 400);
    assert.equal((await attempt({ current: ADMIN.password, next: ADMIN.password })).status, 400);
    assert.equal((await attempt({ current: ADMIN.password, next: 'x'.repeat(201) })).status, 400);
  }));

test('la contraseña nueva funciona, la anterior no y las otras sesiones se cierran', () =>
  withApp(async (app) => {
    const mine = await app.login(ADMIN, '198.51.100.62');
    const other = await app.login(ADMIN, '198.51.100.63');
    const done = await changePassword(app, mine.cookie, {
      current: ADMIN.password,
      next: NEW_PASSWORD,
    });
    assert.equal(done.status, 200);
    assert.equal((await asAdmin(app, '/api/admin/dashboard', mine.cookie)).status, 200);
    assert.equal((await asAdmin(app, '/api/admin/dashboard', other.cookie)).status, 401);
    assert.equal((await app.login(ADMIN, '198.51.100.64')).res.status, 401);
    const fresh = await app.login({ ...ADMIN, password: NEW_PASSWORD }, '198.51.100.65');
    assert.equal(fresh.res.status, 200);
    const log = (await asAdmin(app, '/api/admin/activity', fresh.cookie)).data;
    assert.ok(log.some((e) => e.action === 'cuenta.clave' && e.actor === ADMIN.username));
  }));

test('la clave del perfil sobrevive a un reinicio salvo que cambie la configuración', () =>
  withApp(async (app) => {
    const { cookie } = await app.login(ADMIN, '198.51.100.66');
    await changePassword(app, cookie, { current: ADMIN.password, next: NEW_PASSWORD });
    const same = loadConfig({ ADMIN_USER: ADMIN.username, ADMIN_PASSWORD: ADMIN.password });
    await ensureAdmin(app.repo, same);
    const kept = await app.login({ ...ADMIN, password: NEW_PASSWORD }, '198.51.100.67');
    assert.equal(kept.res.status, 200);
    assert.equal((await app.login(ADMIN, '198.51.100.68')).res.status, 401);
    const changed = loadConfig({
      ADMIN_USER: ADMIN.username,
      ADMIN_PASSWORD: 'clave-restablecida-desde-servidor',
    });
    await ensureAdmin(app.repo, changed);
    const reset = await app.login({ ...ADMIN, password: changed.adminPassword }, '198.51.100.69');
    assert.equal(reset.res.status, 200);
    const old = await app.login({ ...ADMIN, password: NEW_PASSWORD }, '198.51.100.70');
    assert.equal(old.res.status, 401);
  }));

test('el cambio de contraseña tiene límite de intentos', () =>
  withApp(async (app) => {
    const { cookie } = await app.login(ADMIN, '198.51.100.71');
    let last;
    for (let i = 0; i < 6; i++) {
      last = await changePassword(app, cookie, { current: 'incorrecta', next: NEW_PASSWORD });
    }
    assert.equal(last.status, 429);
  }));

test('puedo cerrar las otras sesiones sin perder la actual', () =>
  withApp(async (app) => {
    const mine = await app.login(ADMIN, '198.51.100.72');
    const phone = await app.login(ADMIN, '198.51.100.73');
    const laptop = await app.login(ADMIN, '198.51.100.74');
    const revoke = (cookie) =>
      app.call('/api/admin/sessions/revoke', { method: 'POST', cookie, data: {} });
    assert.equal((await revoke(undefined)).status, 401);
    const result = await revoke(mine.cookie);
    assert.equal(result.status, 200);
    assert.equal(result.data.closed, 2);
    assert.equal((await app.call('/api/admin/dashboard', { cookie: mine.cookie })).status, 200);
    assert.equal((await app.call('/api/admin/dashboard', { cookie: phone.cookie })).status, 401);
    assert.equal((await app.call('/api/admin/dashboard', { cookie: laptop.cookie })).status, 401);
  }));
