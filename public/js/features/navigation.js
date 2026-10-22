import { $, closeDialogs } from '../lib/dom.js';
import { notify } from '../lib/notify.js';
import { products, favorites, setStoreData, setShopPage } from '../state/store.js';
import { loadStoreData } from '../state/loaders.js';
import { legalPages } from '../content/legal-pages.js';
import { empty } from '../components/layout.js';
import { home } from '../views/home.js';
import { shop } from '../views/shop.js';
import { catalogPage } from '../views/catalogs.js';
import { detail } from '../views/product-detail.js';
import { contact } from '../views/contact.js';
import { about } from '../views/about.js';
import { legal } from '../views/legal.js';
import { claims } from '../views/claims.js';
import { renderAdmin } from '../views/admin.js';
import {
  mountProductShowcase,
  destroyProductShowcase,
} from '../views/sections/product-showcase.js';
import { mountLivingEffects, destroyLivingEffects } from '../effects/living-effects.js';
import { openBook } from './catalog-viewer.js';
import { closeNavbarMenus } from './navbar.js';

export async function navigate(url, { replace = false, scroll = true } = {}) {
  closeDialogs();
  if (replace) history.replaceState({}, '', url);
  else if (location.pathname + location.search !== url) history.pushState({}, '', url);
  setShopPage(1);
  if (location.pathname !== '/admin') {
    try {
      setStoreData(await loadStoreData());
    } catch {
      notify('No pudimos actualizar la tienda. Revisa tu conexión.');
    }
  }
  await render();
  if (scroll) window.scrollTo({ top: 0, behavior: 'instant' });
  $('#main').focus({ preventScroll: true });
}
export async function render() {
  destroyLivingEffects();
  destroyProductShowcase();
  const route = location.pathname;
  const main = $('#main');
  main.dataset.view =
    route === '/catalogos'
      ? 'catalogs'
      : route === '/tienda' || route === '/favoritos'
        ? 'shop'
        : route === '/'
          ? 'home'
          : 'other';
  document.querySelectorAll('.desktop-nav a').forEach((a) => {
    if (a.pathname === route) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  closeNavbarMenus();
  const title =
    route === '/tienda'
      ? 'Tienda'
      : route === '/catalogos'
        ? 'Catálogos'
        : route === '/favoritos'
          ? 'Mis favoritos'
          : route === '/contacto'
            ? 'Contacto'
            : route === '/nosotros'
              ? 'Nosotros'
              : route.startsWith('/producto/')
                ? products.find((p) => p.id === Number(route.split('/')[2]))?.name
                : route.startsWith('/legal/')
                  ? legalPages[route.split('/')[2]]?.title
                  : route === '/admin'
                    ? 'Administración'
                    : route === '/reclamaciones'
                      ? 'Libro de Reclamaciones'
                      : null;
  document.title = title
    ? `${title} · BabyCity Perú`
    : 'BabyCity Perú · El mundo de tu bebé, a un clic';
  if (route === '/admin') {
    await renderAdmin(main);
    return;
  }
  main.innerHTML =
    route === '/'
      ? home()
      : route === '/tienda'
        ? shop()
        : route === '/favoritos'
          ? shop(true)
          : route === '/catalogos'
            ? catalogPage()
            : route.startsWith('/producto/')
              ? detail(Number(route.split('/')[2]))
              : route === '/contacto'
                ? contact()
                : route === '/nosotros'
                  ? about()
                  : route === '/reclamaciones'
                    ? claims()
                    : route.startsWith('/legal/') && legalPages[route.split('/')[2]]
                      ? legal(route.split('/')[2])
                      : empty(
                          'Esta página no está aquí',
                          'Encuentra lo que necesitas en nuestra tienda.',
                        );
  if (route === '/') {
    mountProductShowcase(main, products, () => favorites);
    mountLivingEffects(main);
  }
  const linked = new URLSearchParams(location.search).get('libro');
  if (route === '/catalogos' && linked) openBook(linked);
  if ($('#shopSort'))
    $('#shopSort').onchange = (e) => {
      const p = new URLSearchParams(location.search);
      p.set('orden', e.target.value);
      navigate(location.pathname + '?' + p);
    };
}
