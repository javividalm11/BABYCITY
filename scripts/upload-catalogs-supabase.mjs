// Subo los PDF de catalogo/ al bucket de Supabase. Las claves se leen del entorno, no del código.
// Uso: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/upload-catalogs-supabase.mjs
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { SupabaseStorage } from '../src/adapters/cloudflare/supabase-storage.js';

const { SUPABASE_URL: url, SUPABASE_SERVICE_KEY: key } = process.env;
if (!url || !key) throw new Error('Define SUPABASE_URL y SUPABASE_SERVICE_KEY');

const storage = new SupabaseStorage({
  url,
  key,
  bucket: process.env.SUPABASE_BUCKET || 'babycity-files',
});
const folder = 'catalogo';

for (const name of readdirSync(folder).filter((n) => n.toLowerCase().endsWith('.pdf'))) {
  console.log('Subiendo', name);
  await storage.put(`catalogo/${name}`, readFileSync(path.join(folder, name)), 'application/pdf');
}
console.log('Listo');
