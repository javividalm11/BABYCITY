import { encoder, randomHex, safeEqual, toHex } from './crypto.js';

// Uso el máximo de iteraciones que aceptan ambos entornos de ejecución.
const ITERATIONS = 100_000;
const DUMMY_SALT = 'sin-usuario';

export async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations: ITERATIONS },
    key,
    256,
  );
  return toHex(bits);
}

export async function createCredentials(password) {
  const salt = randomHex(32);
  return { salt, hash: await hashPassword(password, salt) };
}

// Calculo el hash aun sin usuario para que el tiempo de respuesta no lo delate.
export async function verifyPassword(password, admin) {
  const actual = await hashPassword(String(password).slice(0, 1000), admin?.salt ?? DUMMY_SALT);
  return Boolean(admin) && safeEqual(actual, admin.hash);
}
