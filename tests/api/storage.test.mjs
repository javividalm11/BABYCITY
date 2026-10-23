import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { createStorage } from '../../src/adapters/cloudflare/storage.js';
import { SupabaseStorage } from '../../src/adapters/cloudflare/supabase-storage.js';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

// Reemplazo fetch por un registro de llamadas con la respuesta que indique cada prueba.
function mockFetch(respond) {
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), ...init });
    return respond(calls.at(-1));
  };
  return calls;
}

const storage = (key = 'sb_secret_abc') =>
  new SupabaseStorage({ url: 'https://demo.supabase.co/', key, bucket: 'babycity-files' });

test('guardar envía el archivo al bucket con la clave en la cabecera', async () => {
  const calls = mockFetch(() => new Response('{}', { status: 200 }));
  await storage().put('uploads/a.png', new Uint8Array([1, 2, 3]), 'image/png');
  const [call] = calls;
  assert.equal(call.url, 'https://demo.supabase.co/storage/v1/object/babycity-files/uploads/a.png');
  assert.equal(call.method, 'POST');
  assert.equal(call.headers.apikey, 'sb_secret_abc');
  assert.equal(call.headers.Authorization, undefined);
  assert.equal(call.headers['Content-Type'], 'image/png');
  assert.equal(call.headers['x-upsert'], 'true');
});

test('las claves antiguas en formato JWT también van como Bearer', async () => {
  const calls = mockFetch(() => new Response('{}', { status: 200 }));
  await storage('eyJhbGciOi.payload.firma').put('uploads/a.png', new Uint8Array([1]), 'image/png');
  assert.equal(calls[0].headers.Authorization, 'Bearer eyJhbGciOi.payload.firma');
});

test('los nombres con espacios y tildes se codifican en la dirección', async () => {
  const calls = mockFetch(
    () => new Response('pdf', { headers: { 'content-type': 'application/pdf' } }),
  );
  await storage().get('catalogo/CATÁLOGO COCHES 2026.pdf');
  assert.match(calls[0].url, /catalogo\/CAT%C3%81LOGO%20COCHES%202026\.pdf$/);
});

test('leer devuelve el contenido y su tipo; un archivo ausente devuelve null', async () => {
  mockFetch(() => new Response('hola', { headers: { 'content-type': 'application/pdf' } }));
  const found = await storage().get('catalogo/a.pdf');
  assert.equal(found.contentType, 'application/pdf');
  assert.equal(await new Response(found.body).text(), 'hola');
  mockFetch(() => new Response('{"error":"not_found"}', { status: 400 }));
  assert.equal(await storage().get('catalogo/falta.pdf'), null);
  mockFetch(() => new Response('', { status: 404 }));
  assert.equal(await storage().get('catalogo/falta.pdf'), null);
});

test('los errores del servicio no se disfrazan de archivo ausente', async () => {
  mockFetch(() => new Response('', { status: 500 }));
  await assert.rejects(() => storage().get('catalogo/a.pdf'), /500/);
  await assert.rejects(
    () => storage().put('uploads/a.png', new Uint8Array([1]), 'image/png'),
    /500/,
  );
});

test('elijo el almacén según los recursos disponibles', async () => {
  const r2 = { FILES: { get: async () => null, put: async () => {} } };
  assert.equal(createStorage(r2).constructor.name, 'R2Storage');
  const supabase = createStorage({
    SUPABASE_URL: 'https://demo.supabase.co',
    SUPABASE_SERVICE_KEY: 'k',
  });
  assert.equal(supabase.constructor.name, 'SupabaseStorage');
  const none = createStorage({ SUPABASE_URL: '', SUPABASE_SERVICE_KEY: '' });
  assert.equal(await none.get('uploads/x.png'), null);
  await assert.rejects(
    () => none.put('uploads/x.png', new Uint8Array([1]), 'image/png'),
    /no está configurado/,
  );
});
