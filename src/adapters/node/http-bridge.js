import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { HttpError } from '../../http/errors.js';

const HOST = /^[a-z0-9.-]+(:\d{1,5})?$/i;
const first = (value) =>
  String(value ?? '')
    .split(',')[0]
    .trim();

// Con proxy de confianza uso el último valor de X-Forwarded-For, el que añadió el proxy.
function clientIpOf(req, trustProxy) {
  const forwarded = String(req.headers['x-forwarded-for'] ?? '').split(',');
  const proxied = forwarded[forwarded.length - 1].trim();
  return (trustProxy && proxied) || req.socket.remoteAddress || 'local';
}

async function readBody(req, maxBytes) {
  if (Number(req.headers['content-length'] ?? 0) > maxBytes)
    throw new HttpError(413, 'Archivo demasiado grande.');
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new HttpError(413, 'Archivo demasiado grande.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// Convierto la petición de Node en una Request estándar con origen y URL verificados.
export async function toWebRequest(req, { trustProxy, maxBodyBytes }) {
  const proto = trustProxy
    ? first(req.headers['x-forwarded-proto']) || 'http'
    : req.socket.encrypted
      ? 'https'
      : 'http';
  const host = (trustProxy && first(req.headers['x-forwarded-host'])) || req.headers.host || '';
  if (!HOST.test(host) || !['http', 'https'].includes(proto) || !req.url.startsWith('/')) {
    throw new HttpError(400, 'Solicitud inválida.');
  }
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    headers.append(name, Array.isArray(value) ? value.join(', ') : value);
  }
  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const request = new Request(`${proto}://${host}${req.url}`, {
    method: req.method,
    headers,
    body: hasBody ? await readBody(req, maxBodyBytes) : undefined,
  });
  return { request, clientIp: clientIpOf(req, trustProxy) };
}

export async function sendResponse(res, response, headOnly) {
  const headers = {};
  for (const [name, value] of response.headers) if (name !== 'set-cookie') headers[name] = value;
  const cookies = response.headers.getSetCookie();
  if (cookies.length) headers['set-cookie'] = cookies;
  res.writeHead(response.status, headers);
  if (headOnly || !response.body) return res.end();
  await pipeline(Readable.fromWeb(response.body), res);
}
