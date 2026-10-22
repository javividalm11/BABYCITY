import { renderMegaMenu, renderMobileMenu } from '../components/navbar-content.js';

let dispose = () => {};
let closeMenus = () => {};
let toggleMobile = () => {};

export const closeNavbarMenus = () => closeMenus();
export const toggleMobileNavigation = () => toggleMobile();

export function initializeNavbar() {
  dispose();
  const header = document.querySelector('.site-header');
  const mega = document.querySelector('#shopMegaMenu');
  const trigger = document.querySelector('#megaMenuButton');
  const shop = document.querySelector('.site-shop');
  const mobile = document.querySelector('#mobileMenu');
  const menuButton = document.querySelector('#menuButton');
  if (!header || !mega || !trigger || !shop || !mobile || !menuButton) return;

  mega.innerHTML = renderMegaMenu();
  mobile.innerHTML = renderMobileMenu();
  const controller = new AbortController();
  const { signal } = controller;
  const desktop = matchMedia('(min-width: 1200px)');
  let closeTimer = null;
  let scrollFrame = 0;
  let lastY = Math.max(0, scrollY);
  let direction = 0;
  let distance = 0;

  function reveal() {
    header.classList.remove('is-scroll-hidden');
    header.inert = false;
  }
  function close() {
    clearTimeout(closeTimer);
    mega.hidden = true;
    mobile.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Abrir menú');
    header.classList.remove('has-open-menu');
  }
  function openMega() {
    if (!desktop.matches) return;
    clearTimeout(closeTimer);
    reveal();
    mega.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    header.classList.add('has-open-menu');
  }
  function delayedClose() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (!mega.contains(document.activeElement) && !shop.contains(document.activeElement)) close();
    }, 160);
  }
  function scrollChanged() {
    scrollFrame = 0;
    const nextY = Math.max(0, scrollY);
    const delta = nextY - lastY;
    lastY = nextY;
    if (Math.abs(delta) < 1) return;
    const nextDirection = Math.sign(delta);
    distance = nextDirection === direction ? distance + Math.abs(delta) : Math.abs(delta);
    direction = nextDirection;
    if (nextY < 20 || nextDirection < 0 && distance >= 6) {
      reveal();
    } else if (nextY > header.offsetHeight + 30 && distance >= 12 && !header.contains(document.activeElement)) {
      close();
      header.classList.add('is-scroll-hidden');
      header.inert = true;
    }
  }
  function scrollRequested() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(scrollChanged);
  }

  closeMenus = () => {
    close();
    reveal();
    lastY = Math.max(0, scrollY);
    distance = 0;
  };
  toggleMobile = () => {
    if (desktop.matches) return;
    const open = mobile.hidden;
    close();
    if (open) {
      reveal();
      mobile.hidden = false;
      menuButton.setAttribute('aria-expanded', 'true');
      menuButton.setAttribute('aria-label', 'Cerrar menú');
      header.classList.add('has-open-menu');
    }
  };

  shop.addEventListener('pointerenter', (event) => { if (event.pointerType === 'mouse') openMega(); }, { signal });
  shop.addEventListener('pointerleave', delayedClose, { signal });
  mega.addEventListener('pointerenter', () => clearTimeout(closeTimer), { signal });
  mega.addEventListener('pointerleave', delayedClose, { signal });
  trigger.addEventListener('click', () => { if (mega.hidden) openMega(); else close(); }, { signal });
  shop.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown') return;
    event.preventDefault();
    openMega();
    mega.querySelector('a')?.focus();
  }, { signal });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || mega.hidden && mobile.hidden) return;
    const focus = mobile.hidden ? trigger : menuButton;
    close();
    focus.focus({ preventScroll: true });
  }, { signal });
  document.addEventListener('click', (event) => { if (!header.contains(event.target)) close(); }, { signal, capture: true });
  header.addEventListener('focusin', reveal, { signal });
  header.addEventListener('focusout', () => {
    queueMicrotask(() => { if (!header.contains(document.activeElement)) close(); });
  }, { signal });
  window.addEventListener('scroll', scrollRequested, { passive: true, signal });
  desktop.addEventListener('change', closeNavbarMenus, { signal });
  dispose = () => {
    controller.abort();
    clearTimeout(closeTimer);
    cancelAnimationFrame(scrollFrame);
    close();
    reveal();
  };
}
