import { legalPages } from '../content/legal-pages.js';

export function legal(key) {
  const p = legalPages[key];
  return `<section class="section"><article class="container prose"><span class="eyebrow">Transparencia para tu tranquilidad</span><h1>${p.title}</h1><p class="fine">Versión: 20 de octubre de 2026</p>${p.html}</article></section>`;
}
