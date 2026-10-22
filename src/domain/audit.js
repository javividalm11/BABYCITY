import { text } from './validation.js';

// Dejo la IP sin su último tramo para registrar el origen sin identificar a una persona.
export function maskIp(ip) {
  if (ip.includes(':')) return ip.split(':').slice(0, 4).join(':') + ':…';
  return ip.replace(/\.\d+$/, '.x');
}

// Registro quién hizo qué; los textos se recortan para que el registro no crezca sin control.
export function audit(repo, actor, action, target = '', detail = '') {
  return repo.addAudit(
    new Date().toISOString(),
    text(actor, 100),
    text(action, 60),
    text(target, 100),
    text(detail, 200),
  );
}
