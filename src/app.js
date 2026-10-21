import { createRouter } from './http/router.js';
import { fail, HttpError } from './http/errors.js';
import { assertSameSite, isWrite, readJson } from './http/request.js';
import { json } from './http/responses.js';
import { withSecurityHeaders } from './http/security-headers.js';
import { adminApiRoutes } from './routes/admin-api.js';
import { publicApiRoutes } from './routes/public-api.js';
import { serveAsset, siteRoutes } from './routes/site.js';
import { ensureAdmin } from './security/admin-bootstrap.js';
import { enforceRateLimit } from './security/rate-limit.js';
import { hasValidSession } from './security/sessions.js';

function errorResponse(error) {
  if (error instanceof HttpError) return json(error.status, { error: error.message });
  console.error(error);
  return json(500, { error: 'No pudimos procesar la solicitud.' });
}

// Armo la aplicación a partir de puertos (repo, files, assets); no conoce el entorno donde corre.
export function createApp({ config, repo, files, assets, seedProducts }) {
  const match = createRouter([...publicApiRoutes, ...adminApiRoutes, ...siteRoutes]);
  let ready;

  const start = () => {
    ready ||= (async () => {
      await repo.init(seedProducts);
      await ensureAdmin(repo, config);
    })().catch((error) => {
      ready = undefined;
      throw error;
    });
    return ready;
  };

  async function dispatch(request, clientIp) {
    const url = new URL(request.url);
    const method = request.method === 'HEAD' ? 'GET' : request.method;
    if (isWrite(method)) assertSameSite(request, url);
    const ctx = {
      request,
      url,
      config,
      repo,
      files,
      assets,
      clientIp,
      params: {},
      body: () => readJson(request, config.maxBodyBytes),
    };
    const found = match(method, url.pathname);
    if (!found) {
      if (url.pathname.startsWith('/api/')) throw fail(404, 'Ruta no encontrada.');
      if (method !== 'GET') throw fail(405, 'Método no permitido.');
      return serveAsset(ctx);
    }
    if (found.allowed) throw fail(405, 'Método no permitido.');
    const { route, params } = found;
    if (route.admin && !(await hasValidSession(repo, request, config.cookieName))) {
      throw fail(401, 'Inicia sesión para continuar.');
    }
    if (route.limit)
      await enforceRateLimit(repo, `${clientIp}:${route.limit.bucket}`, route.limit.max);
    return route.handler({ ...ctx, params });
  }

  return {
    async handle(request, { clientIp = 'local' } = {}) {
      let response;
      try {
        await start();
        response = await dispatch(request, clientIp);
      } catch (error) {
        response = errorResponse(error);
      }
      return withSecurityHeaders(response, new URL(request.url));
    },
  };
}
