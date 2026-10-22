import { api } from '../../lib/api.js';
import { admin } from './state.js';

// Si el servidor ya cerró la sesión, llevo a la persona al inicio de sesión.
export async function request(url, method, data) {
  try {
    return await api(url, method, data);
  } catch (error) {
    if (error.status === 401) admin.showLogin('Tu sesión terminó. Ingresa de nuevo.');
    throw error;
  }
}
