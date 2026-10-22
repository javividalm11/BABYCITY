import { randomHex, sha256Hex } from './crypto.js';
import { readCookie } from '../http/request.js';

// Guardo solo el hash del token; el valor original vive únicamente en la cookie.
export async function startSession(repo, config, username) {
  const token = randomHex(32);
  const now = Date.now();
  await repo.purgeExpired(now);
  const idle = now + config.sessionIdleMs;
  await repo.createSession(await sha256Hex(token), username, idle, now + config.sessionTtlMs);
  return token;
}

// Valido la sesión y, si sigue viva, renuevo su ventana de inactividad.
export async function getSession(repo, request, config) {
  const token = readCookie(request, config.cookieName);
  if (!token) return null;
  const hash = await sha256Hex(token);
  const session = await repo.touchSession(hash, Date.now(), config.sessionIdleMs);
  return session && { ...session, hash };
}

export async function endSession(repo, request, cookieName) {
  const token = readCookie(request, cookieName);
  if (token) await repo.removeSession(await sha256Hex(token));
}

export function sessionCookie(name, token, ttlMs, url) {
  const secure = url.protocol === 'https:' ? '; Secure' : '';
  const maxAge = Math.floor(ttlMs / 1000);
  return `${name}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`;
}

export const clearedCookie = (name, url) => sessionCookie(name, '', 0, url);
