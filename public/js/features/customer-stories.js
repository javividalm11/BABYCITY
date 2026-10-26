import { mountPackageGallery } from './package-gallery.js';

let cleanup = () => {};

export function destroyCustomerStories() {
  cleanup();
  cleanup = () => {};
}

export function mountCustomerStories(root) {
  destroyCustomerStories();
  const cleanups = [...root.querySelectorAll('.customer-stories-carousel, .dispatch-carousel')].map(
    mountCarousel,
  );
  for (const gallery of root.querySelectorAll('.package-gallery'))
    cleanups.push(mountPackageGallery(gallery));
  cleanup = () => cleanups.forEach((dispose) => dispose());
}

function mountCarousel(carousel) {
  const track = carousel.querySelector('.customer-stories-track');
  const cards = [...track.children];
  const status = carousel.querySelector('[data-stories-status]');
  const pause = carousel.querySelector('[data-stories-pause]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const controller = new AbortController();
  const options = { signal: controller.signal };
  let paused = reduced.matches;
  let hovered = false;
  const step = () => cards[1].offsetLeft - cards[0].offsetLeft;
  const visible = () => Math.max(1, Math.round(track.clientWidth / step()));
  const index = () => Math.round(track.scrollLeft / step());
  const update = () => {
    const first = index();
    status.textContent = `${first + 1}–${Math.min(cards.length, first + visible())} de ${cards.length}`;
    pause.textContent = paused ? 'Reanudar' : 'Pausar';
    pause.setAttribute('aria-pressed', String(paused));
  };
  const move = (direction) => {
    const last = cards.length - visible();
    const current = index();
    const next =
      direction > 0
        ? current >= last
          ? 0
          : Math.min(last, current + visible())
        : current <= 0
          ? last
          : Math.max(0, current - visible());
    track.scrollTo({ left: next * step(), behavior: reduced.matches ? 'instant' : 'smooth' });
  };
  carousel.querySelector('[data-stories-prev]').addEventListener('click', () => move(-1), options);
  carousel.querySelector('[data-stories-next]').addEventListener('click', () => move(1), options);
  pause.addEventListener(
    'click',
    () => {
      paused = !paused;
      update();
    },
    options,
  );
  carousel.addEventListener(
    'pointerenter',
    (event) => {
      hovered = event.pointerType === 'mouse';
    },
    options,
  );
  carousel.addEventListener(
    'pointerleave',
    () => {
      hovered = false;
    },
    options,
  );
  // A touch gesture stops rotation so the reader can explore at their own pace.
  track.addEventListener(
    'pointerdown',
    () => {
      paused = true;
      update();
    },
    options,
  );
  track.addEventListener('scroll', update, options);
  track.addEventListener(
    'keydown',
    (event) => {
      if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 1 : -1);
    },
    options,
  );
  reduced.addEventListener(
    'change',
    () => {
      paused = reduced.matches;
      update();
    },
    options,
  );
  const resize = new ResizeObserver(update);
  resize.observe(track);
  let inView = false;
  const observer = new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
    },
    { threshold: 0.5 },
  );
  observer.observe(carousel);
  const timer = setInterval(() => {
    if (
      !paused &&
      !hovered &&
      inView &&
      !document.hidden &&
      !carousel.contains(document.activeElement)
    )
      move(1);
  }, 6500);
  update();
  return () => {
    clearInterval(timer);
    controller.abort();
    resize.disconnect();
    observer.disconnect();
  };
}
