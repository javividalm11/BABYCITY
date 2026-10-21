import { readFileSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../../app.js';
import { loadConfig } from '../../config.js';
import { HttpError } from '../../http/errors.js';
import { FileStorage } from './file-storage.js';
import { sendResponse, toWebRequest } from './http-bridge.js';
import { SqliteRepository } from './sqlite-repository.js';
import { StaticAssets } from './static-assets.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function failure(res, status, message) {
  if (res.headersSent) return res.destroy();
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify({ error: message }));
}

// Ensamblo la aplicación sobre SQLite y disco local. Las opciones permiten aislar las pruebas.
export function createNodeServer({ env = process.env, dbPath, uploadDir, publicDir } = {}) {
  const config = loadConfig(env);
  const repo = new SqliteRepository(
    dbPath ?? env.DB_PATH ?? path.join(ROOT, 'data/babycity.sqlite'),
  );
  const app = createApp({
    config,
    repo,
    files: new FileStorage({
      uploads: uploadDir ?? env.UPLOAD_DIR ?? path.join(ROOT, 'data/uploads'),
      catalogo: path.join(ROOT, 'catalogo'),
    }),
    assets: new StaticAssets(publicDir ?? path.join(ROOT, 'public')),
    seedProducts: JSON.parse(readFileSync(path.join(ROOT, 'data/products.json'), 'utf8')),
  });
  const server = http.createServer(async (req, res) => {
    try {
      const { request, clientIp } = await toWebRequest(req, config);
      await sendResponse(res, await app.handle(request, { clientIp }), req.method === 'HEAD');
    } catch (error) {
      if (error instanceof HttpError) return failure(res, error.status, error.message);
      console.error(error);
      failure(res, 500, 'No pudimos procesar la solicitud.');
    }
  });
  return { server, repo, app };
}
