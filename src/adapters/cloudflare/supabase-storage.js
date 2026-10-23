// Guardo y leo archivos en un bucket privado de Supabase Storage con claves "uploads/..." y "catalogo/...".
export class SupabaseStorage {
  constructor({ url, key, bucket }) {
    this.base = `${url.replace(/\/$/, '')}/storage/v1/object`;
    this.bucket = bucket;
    this.key = key;
  }

  // Las claves nuevas (sb_secret_...) van solo en apikey; las antiguas, que son JWT, también como Bearer.
  #headers(extra = {}) {
    const headers = { apikey: this.key, ...extra };
    if (this.key.startsWith('eyJ')) headers.Authorization = `Bearer ${this.key}`;
    return headers;
  }

  #url(key) {
    return `${this.base}/${this.bucket}/${key.split('/').map(encodeURIComponent).join('/')}`;
  }

  async put(key, bytes, contentType) {
    const response = await fetch(this.#url(key), {
      method: 'POST',
      headers: this.#headers({ 'Content-Type': contentType, 'x-upsert': 'true' }),
      body: bytes,
    });
    if (!response.ok) throw new Error(`Supabase Storage respondió ${response.status} al guardar`);
  }

  async get(key) {
    const response = await fetch(this.#url(key), { headers: this.#headers() });
    // Supabase responde 400 o 404 cuando el archivo no existe.
    if (response.status === 400 || response.status === 404) return null;
    if (!response.ok) throw new Error(`Supabase Storage respondió ${response.status} al leer`);
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    return { body: response.body, contentType };
  }
}
