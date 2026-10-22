import { MIN_ADMIN_PASSWORD } from '../constants.js';
import { sha256Hex } from './crypto.js';
import { createCredentials } from './passwords.js';

// La configuración crea la cuenta la primera vez. Después la clave se gestiona desde el perfil;
// solo restablezco la cuenta si cambian el usuario o la clave de la configuración.
export async function ensureAdmin(repo, config) {
  const { adminUser: username, adminPassword: password } = config;
  if (password.length < MIN_ADMIN_PASSWORD) return;
  const seed = await sha256Hex(`${username}\n${password}`);
  const current = await repo.getAdminAccount();
  if (current?.username === username && current.env_seed === seed) return;
  const { salt, hash } = await createCredentials(password);
  await repo.replaceAdmin(username, salt, hash, seed);
}
