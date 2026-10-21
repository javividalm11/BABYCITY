import { fail } from './errors.js';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
export const isWrite = (method) => WRITE_METHODS.has(method);

// Acepto escrituras solo si el navegador confirma que vienen de este mismo sitio.
export function assertSameSite(request, url) {
  const origin = request.headers.get('origin');
  if (origin) {
    if (origin !== url.origin) throw fail(403, 'Origen no permitido.');
    return;
  }
  if (request.headers.get('sec-fetch-site') !== 'same-origin') {
    throw fail(403, 'Origen no permitido.');
  }
}

// Leo un objeto JSON con tipo y tamaño controlados.
export async function readJson(request, maxBytes) {
  const type = (request.headers.get('content-type') || '').toLowerCase();
  if (!type.startsWith('application/json')) throw fail(415, 'Formato no admitido.');
  if (Number(request.headers.get('content-length') || 0) > maxBytes) {
    throw fail(413, 'Archivo demasiado grande.');
  }
  const raw = await request.text();
  if (raw.length > maxBytes) throw fail(413, 'Archivo demasiado grande.');
  let value;
  try {
    value = JSON.parse(raw || '{}');
  } catch {
    throw fail(400, 'Solicitud inválida.');
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw fail(400, 'Solicitud inválida.');
  }
  return value;
}

export function readCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  const match = new RegExp(`(?:^|;\\s*)${name}=([a-f0-9]+)`).exec(header);
  return match ? match[1] : null;
}
