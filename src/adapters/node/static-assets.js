import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

// Sirvo solo extensiones conocidas.
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

const notFound = () => new Response('Not found', { status: 404 });

// Sirvo la carpeta pública con la misma interfaz que usan los demás adaptadores.
export class StaticAssets {
  constructor(root) {
    this.root = path.resolve(root);
  }

  async fetch(request) {
    let relative;
    try {
      relative = decodeURIComponent(new URL(request.url).pathname);
    } catch {
      return notFound();
    }
    const file = path.resolve(this.root, `.${relative}`);
    const type = MIME[path.extname(file).toLowerCase()];
    const inside = file.startsWith(this.root + path.sep);
    if (!inside || !type || path.basename(file).startsWith('.') || relative.includes('\0')) {
      return notFound();
    }
    const info = await stat(file).catch(() => null);
    if (!info?.isFile()) return notFound();
    // Con el ETag el navegador revalida y recibe 304 si nada cambió.
    const etag = `W/"${info.size}-${Math.floor(info.mtimeMs)}"`;
    if (request.headers.get('if-none-match') === etag) {
      return new Response(null, { status: 304, headers: { ETag: etag } });
    }
    return new Response(Readable.toWeb(createReadStream(file)), {
      headers: { 'Content-Type': type, 'Content-Length': String(info.size), ETag: etag },
    });
  }
}
