import { randomHex, sha256Hex } from './crypto.js';
import { readCookie } from '../http/request.js';

// Guardo solo el hash del token; el valor original vive únicamente en la cookie.
export async function startSession(repo, ttlMs) {
  const token = randomHex(32);
  const now = Date.now();
  await repo.purgeSessions(now);
  await repo.createSession(await sha256Hex(token), now + ttlMs);
  return token;
}

export async function hasValidSession(repo, request, cookieName) {
  const token = readCookie(request, cookieName);
  return Boolean(token && (await repo.findSession(await sha256Hex(token), Date.now())));
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
