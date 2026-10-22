import { icon } from '../lib/icons.js';
import { renderContactAdvice } from './contact-advice.js';

export const intro = (eyebrow, title, description) =>
  `<section class="page-intro"><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${description}</p></section>`;
export const empty = (title, copy) =>
  `<div class="empty">${icon('heart')}<h2>${title}</h2><p>${copy}</p><a class="btn primary" href="/tienda" data-link>Descubrir la tienda →</a></div>`;
export const categoryLink = (c) => '/tienda?categoria=' + encodeURIComponent(c);
export function cta() {
  return `<div class="advice-section">${renderContactAdvice()}</div>`;
}
