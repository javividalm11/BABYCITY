import seedProducts from '../../../data/products.json';
import { createApp } from '../../app.js';
import { loadConfig } from '../../config.js';
import { D1Repository } from './d1-repository.js';
import { R2Storage } from './r2-storage.js';

let app;

// Construyo la aplicación una vez por instancia con los recursos que Cloudflare inyecta.
function getApp(env) {
  app ||= createApp({
    config: loadConfig(env),
    repo: new D1Repository(env.DB),
    files: new R2Storage(env.FILES),
    assets: env.ASSETS,
    seedProducts,
  });
  return app;
}

export default {
  fetch(request, env) {
    const clientIp = request.headers.get('CF-Connecting-IP') || 'local';
    return getApp(env).handle(request, { clientIp });
  },
};
