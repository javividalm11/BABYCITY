import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createNodeServer } from '../src/adapters/node/server.js';

// Levanto un servidor aislado con base de datos nueva en cada ejecución.
const dir = path.resolve('test-results');
mkdirSync(dir, { recursive: true });
writeFileSync(path.join(dir, 'browser-server.pid'), String(process.pid));
for (const suffix of ['', '-shm', '-wal'])
  rmSync(path.join(dir, `browser.sqlite${suffix}`), { force: true });

const { server } = createNodeServer({
  dbPath: path.join(dir, 'browser.sqlite'),
  uploadDir: path.join(dir, 'uploads'),
  env: { ADMIN_USER: 'browser-test', ADMIN_PASSWORD: 'test-only-password-123' },
});
server.listen(3001, '127.0.0.1', () => console.log('Servidor de pruebas: http://127.0.0.1:3001'));
