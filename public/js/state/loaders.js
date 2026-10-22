import { api } from '../lib/api.js';

// Pido catálogo y tarifas vigentes al servidor.
export async function loadStoreData() {
  const [products, shipping] = await Promise.all([api('/api/products'), api('/api/settings')]);
  return { products, shipping };
}

export async function loadInitialData() {
  const [data, catalogs] = await Promise.all([loadStoreData(), api('/catalogs.json')]);
  return { ...data, catalogs };
}
