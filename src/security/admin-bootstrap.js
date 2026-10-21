import { MIN_ADMIN_PASSWORD } from '../constants.js';
import { safeEqual } from './crypto.js';
import { createCredentials, hashPassword } from './passwords.js';

// La cuenta administradora sale de la configuración. Si la clave cambia,
// reemplazo las credenciales y cierro todas las sesiones abiertas.
export async function ensureAdmin(repo, config) {
  const { adminUser: username, adminPassword: password } = config;
  if (password.length < MIN_ADMIN_PASSWORD) return;
  const current = await repo.findAdmin(username);
  if (current && safeEqual(await hashPassword(password, current.salt), current.hash)) return;
  const { salt, hash } = await createCredentials(password);
  await repo.replaceAdmin(username, salt, hash);
}
