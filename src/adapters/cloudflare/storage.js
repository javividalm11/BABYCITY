import { HttpError } from '../../http/errors.js';
import { R2Storage } from './r2-storage.js';
import { SupabaseStorage } from './supabase-storage.js';

// Sin almacén configurado la tienda sigue funcionando; solo falla guardar archivos nuevos.
class UnavailableStorage {
  async put() {
    throw new HttpError(503, 'El almacenamiento de archivos aún no está configurado.');
  }

  async get() {
    return null;
  }
}

// Elijo el almacén según los recursos que el entorno inyecta: R2 o Supabase Storage.
export function createStorage(env) {
  if (env.FILES) return new R2Storage(env.FILES);
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
    return new SupabaseStorage({
      url: env.SUPABASE_URL,
      key: env.SUPABASE_SERVICE_KEY,
      bucket: env.SUPABASE_BUCKET || 'babycity-files',
    });
  }
  return new UnavailableStorage();
}
