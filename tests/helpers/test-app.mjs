import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createNodeServer } from '../../src/adapters/node/server.js';

export const SITE = 'https://babycity.example';
export const ADMIN = { username: 'tester', password: 'long-test-password' };

// Levanto la aplicación completa en memoria y la invoco sin abrir puertos.
export function createTestApp(extraEnv = {}) {
  const uploadDir = mkdtempSync(path.join(tmpdir(), 'babycity-uploads-'));
  const { app, repo } = createNodeServer({
    dbPath: ':memory:',
    uploadDir,
    env: {
      SITE_URL: SITE,
      ADMIN_USER: ADMIN.username,
      ADMIN_PASSWORD: ADMIN.password,
      ...extraEnv,
    },
  });

  async function call(route, options = {}) {
    const {
      method = 'GET',
      data,
      cookie,
      headers = {},
      origin = SITE,
      ip = '203.0.113.5',
    } = options;
    const response = await app.handle(
      new Request(SITE + route, {
        method,
        headers: {
          ...(origin ? { Origin: origin } : {}),
          ...(data !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(cookie ? { Cookie: cookie } : {}),
          ...headers,
        },
        body:
          data === undefined ? undefined : typeof data === 'string' ? data : JSON.stringify(data),
      }),
      { clientIp: ip },
    );
    const isJson = response.headers.get('content-type')?.includes('json');
    return {
      status: response.status,
      headers: response.headers,
      data: isJson ? await response.json() : await response.text(),
    };
  }

  async function login(credentials = ADMIN, ip = '198.51.100.7') {
    const res = await call('/api/admin/login', { method: 'POST', data: credentials, ip });
    return { res, cookie: res.headers.get('set-cookie')?.split(';')[0] };
  }

  const close = () => {
    repo.close();
    rmSync(uploadDir, { recursive: true, force: true });
  };
  return { call, login, repo, close };
}
