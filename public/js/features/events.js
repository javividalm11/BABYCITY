import { $ } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { notify } from '../lib/notify.js';
import {
  addToCart,
  changeQuantity,
  removeFromCart,
  setShopPage,
  toggleFavorite,
} from '../state/store.js';
import { shop } from '../views/shop.js';
import { openAccount } from './account.js';
import { checkout, openCart, renderCart } from './cart.js';
import { openBook } from './catalog-viewer.js';
import { navigate, render } from './navigation.js';
import { toggleMobileNavigation } from './navbar.js';

const withParam = (name, value, { drop = false } = {}) => {
  const params = new URLSearchParams(location.search);
  if (drop) params.delete(name);
  else params.set(name, value);
  return `${location.pathname}?${params}`;
};

function bindSortSelect() {
  const select = $('#shopSort');
  if (select) {
    select.onchange = (e) => navigate(withParam('orden', e.target.value), { scroll: false });
  }
}

function toggleWish(button) {
  const saved = toggleFavorite(Number(button.dataset.wish));
  button.setAttribute('aria-pressed', saved);
  if (button.classList.contains('wish')) {
    button.classList.toggle('saved', saved);
    button.setAttribute('aria-label', saved ? 'Quitar de favoritos' : 'Guardar en favoritos');
  } else {
    button.innerHTML = icon('heart') + (saved ? ' Guardado' : ' Guardar');
  }
  if (location.pathname === '/favoritos') render();
  notify(saved ? 'Guardado con amor ♡' : 'Quitado de favoritos');
}

function showPage(page) {
  setShopPage(page);
  $('#main').innerHTML = shop(location.pathname === '/favoritos');
  bindSortSelect();
  window.scrollTo({ top: 220, behavior: 'smooth' });
}

async function runAction(button) {
  switch (button.dataset.action) {
    case 'cart':
      return openCart();
    case 'search':
      return $('#searchDialog').showModal();
    case 'account':
      return openAccount();
    case 'contact':
      return $('#contactDialog').showModal();
    case 'menu':
      return toggleMobileNavigation();
    case 'checkout':
      return checkout();
    case 'back-cart':
      return renderCart();
  }
}

// Un solo manejador de clics delega según los atributos data-* de cada botón.
function onClick(e) {
  const link = e.target.closest('a[data-link]');
  if (link && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
    e.preventDefault();
    return navigate(link.pathname + link.search);
  }
  const button = e.target.closest('button');
  if (!button) return;
  const { dataset } = button;
  if (button.hasAttribute('data-close')) return button.closest('dialog').close();
  if (dataset.add) return addToCart(Number(dataset.add));
  if (dataset.wish) return toggleWish(button);
  if (dataset.category) {
    const url = withParam('categoria', dataset.category, { drop: dataset.category === 'Todos' });
    return navigate(url, { scroll: false });
  }
  if (dataset.page) return showPage(Number(dataset.page));
  if (dataset.book) return openBook(dataset.book, dataset.bookPage || 1);
  if (dataset.remove) {
    removeFromCart(Number(dataset.remove));
    return renderCart();
  }
  if (dataset.quantity) {
    const problem = changeQuantity(Number(dataset.quantity), Number(dataset.delta));
    if (problem) return notify(problem);
    return renderCart();
  }
  return runAction(button);
}

export function bindEvents() {
  document.addEventListener('click', onClick);
  document.querySelectorAll('dialog').forEach((dialog) =>
    dialog.addEventListener('click', (e) => {
      if (e.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      const outside =
        e.clientX < box.left ||
        e.clientX > box.right ||
        e.clientY < box.top ||
        e.clientY > box.bottom;
      if (outside) dialog.close();
    }),
  );
}
