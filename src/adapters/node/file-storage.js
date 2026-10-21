import { createReadStream } from 'node:fs';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

const BY_EXTENSION = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

// Almacén de archivos en disco. Las claves son "uploads/<archivo>" o "catalogo/<archivo>".
export class FileStorage {
  constructor({ uploads, catalogo }) {
    this.dirs = { uploads: path.resolve(uploads), catalogo: path.resolve(catalogo) };
  }

  #locate(key) {
    const [area, name, ...rest] = key.split('/');
    const dir = this.dirs[area];
    if (!dir || !name || rest.length || name.startsWith('.') || /[\\\0]/.test(name)) return null;
    const file = path.join(dir, name);
    return file.startsWith(dir + path.sep) ? { area, dir, file } : null;
  }

  async put(key, bytes) {
    const target = this.#locate(key);
    if (!target || target.area !== 'uploads') throw new Error('Clave no permitida');
    await mkdir(target.dir, { recursive: true });
    await writeFile(target.file, bytes);
  }

  async get(key) {
    const target = this.#locate(key);
    const info = target && (await stat(target.file).catch(() => null));
    if (!info?.isFile()) return null;
    const contentType = BY_EXTENSION[path.extname(target.file).toLowerCase()];
    if (!contentType) return null;
    return { body: Readable.toWeb(createReadStream(target.file)), contentType };
  }
}
