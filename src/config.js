// Leo el entorno una sola vez y entrego una configuración inmutable.
export function loadConfig(env = {}) {
  return Object.freeze({
    siteUrl: (env.SITE_URL || '').replace(/\/$/, ''),
    trustProxy: env.TRUST_PROXY === 'true',
    adminUser: String(env.ADMIN_USER || 'admin').slice(0, 100),
    adminPassword: String(env.ADMIN_PASSWORD || ''),
    cookieName: 'bc_session',
    sessionTtlMs: 8 * 60 * 60 * 1000,
    sessionIdleMs: 30 * 60 * 1000,
    loginLimit: Number(env.LOGIN_LIMIT) || 10,
    maxBodyBytes: 2_000_000,
    maxImageBytes: 1_048_576,
  });
}
