import { $ } from '../lib/dom.js';
import { catalogs } from '../state/store.js';
import { CatalogReader } from './catalog-reader.js';

const reader = new CatalogReader($('#bookDialog'));

export function openBook(id, page = 1) {
  const catalog = catalogs.find((c) => c.id === id);
  if (catalog) reader.open(catalog, page);
}
