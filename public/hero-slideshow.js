// CSS supplies the seamless five-image loop. This button gives visitors a
// persistent pause without introducing timers that survive SPA navigation.
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-hero-pause]');
  if (!button) return;
  const hero = button.closest('.hero-showcase'),
    paused = hero.classList.toggle('is-paused');
  button.setAttribute('aria-pressed', String(paused));
  button.setAttribute('aria-label', paused ? 'Reanudar animación' : 'Pausar animación');
  button.innerHTML = paused
    ? '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 2 10 6 3 10Z"/></svg>'
    : '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2v8M8 2v8"/></svg>';
});

function updateContactVisibility() {
  const hero = document.querySelector('.hero-showcase');
  document.body.classList.toggle(
    'hero-in-view',
    !!hero && hero.getBoundingClientRect().bottom > document.querySelector('.header').offsetHeight,
  );
}
new MutationObserver(updateContactVisibility).observe(document.querySelector('#main'), {
  childList: true,
});
window.addEventListener('scroll', updateContactVisibility, { passive: true });
window.addEventListener('resize', updateContactVisibility, { passive: true });
updateContactVisibility();
