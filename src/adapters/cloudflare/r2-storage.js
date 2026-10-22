const PDF = 'application/pdf';
const BY_EXTENSION = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', pdf: PDF };

// Guardo y leo archivos en R2 con claves "uploads/..." y "catalogo/...".
export class R2Storage {
  constructor(bucket) {
    this.bucket = bucket;
  }

  async put(key, bytes, contentType) {
    await this.bucket.put(key, bytes, { httpMetadata: { contentType } });
  }

  async get(key) {
    const object = await this.bucket.get(key);
    if (!object) return null;
    const extension = key.slice(key.lastIndexOf('.') + 1).toLowerCase();
    const contentType =
      object.httpMetadata?.contentType || BY_EXTENSION[extension] || 'application/octet-stream';
    return { body: object.body, contentType };
  }
}
