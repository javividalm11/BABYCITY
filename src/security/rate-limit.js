import { fail } from '../http/errors.js';

const WINDOW_MS = 15 * 60 * 1000;

export async function enforceRateLimit(repo, key, max) {
  const hits = await repo.hitRateLimit(key, Date.now(), WINDOW_MS);
  if (hits > max) throw fail(429, 'Demasiados intentos. Vuelve a intentar en 15 minutos.');
}
