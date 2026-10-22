import './effects/hero-slideshow.js';
import { $, closeDialogs } from './lib/dom.js';
import { icon } from './lib/icons.js';
import { esc } from './lib/format.js';
import { pruneCart, setStoreData } from './state/store.js';
import { loadInitialData } from './state/loaders.js';
import { bindEvents } from './features/events.js';
import { bindForms } from './features/forms.js';
import { render } from './features/navigation.js';

function paintStaticIcons() {
  $('#searchButton').innerHTML = icon('search');
  $('#wishButton').innerHTML = icon('heart');
  $('#cartButton').innerHTML = icon('bag') + '<span id="cartCount">0</span>';
  $('#waIcon').innerHTML = icon('chat');
}

async function start() {
  paintStaticIcons();
  bindEvents();
  bindForms();
  window.addEventListener('popstate', () => {
    closeDialogs();
    render();
  });
  try {
    setStoreData(await loadInitialData());
    pruneCart();
    await render();
  } catch (error) {
    $('#main').innerHTML =
      `<div class="container empty"><h1>Estamos preparando todo para ti</h1><p>${esc(error.message)} Puedes llamarnos al +51 937 473 120.</p><a class="btn primary" href="https://wa.me/51937473120">Hablar con BabyCity ↗</a></div>`;
  }
}

start();
