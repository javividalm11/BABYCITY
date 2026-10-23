import seedProducts from '../../../data/products.json';
import { createApp } from '../../app.js';
import { loadConfig } from '../../config.js';
import { D1Repository } from './d1-repository.js';
import { createStorage } from './storage.js';

let app;

// Creo la aplicación una sola vez por instancia con los recursos inyectados.
function getApp(env) {
  app ||= createApp({
    config: loadConfig(env),
    repo: new D1Repository(env.DB),
    files: createStorage(env),
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
