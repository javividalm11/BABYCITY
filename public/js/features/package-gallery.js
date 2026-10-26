export function mountPackageGallery(gallery) {
  const controller = new AbortController();
  const options = { signal: controller.signal };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const rows = [...gallery.querySelectorAll('.package-lane')];
  const pause = gallery.querySelector('[data-package-pause]');
  let paused = reduced.matches;
  let visible = false;
  let hovered = false;
  let focused = false;
  let frame = 0;
  let previous = 0;
  const span = (row) => row.querySelector('.package-group').getBoundingClientRect().width;
  rows[1].scrollLeft = span(rows[1]);
  let positions = rows.map((row) => row.scrollLeft);
  const tick = (time) => {
    const delta = previous ? Math.min(time - previous, 50) : 0;
    previous = time;
    for (const [index, row] of rows.entries()) {
      const width = span(row);
      if (!width) continue;
      positions[index] = (positions[index] + (index ? -1 : 1) * delta * 0.028 + width) % width;
      row.scrollLeft = positions[index];
    }
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    cancelAnimationFrame(frame);
    previous = 0;
    positions = rows.map((row) => row.scrollLeft);
    pause.textContent = paused ? 'Reanudar' : 'Pausar';
    pause.setAttribute('aria-pressed', String(paused));
    if (!paused && visible && !hovered && !focused && !document.hidden)
      frame = requestAnimationFrame(tick);
  };
  const stop = () => {
    paused = true;
    sync();
  };
  pause.addEventListener(
    'click',
    () => {
      paused = !paused;
      sync();
    },
    options,
  );
  gallery.addEventListener(
    'pointerenter',
    (event) => {
      hovered = event.pointerType === 'mouse';
      sync();
    },
    options,
  );
  gallery.addEventListener(
    'pointerleave',
    () => {
      hovered = false;
      sync();
    },
    options,
  );
  gallery.addEventListener(
    'focusin',
    () => {
      focused = true;
      sync();
    },
    options,
  );
  gallery.addEventListener(
    'focusout',
    (event) => {
      focused = gallery.contains(event.relatedTarget);
      sync();
    },
    options,
  );
  for (const row of rows) {
    row.addEventListener('pointerdown', stop, options);
    row.addEventListener(
      'keydown',
      (event) => {
        if (event.target !== row || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        stop();
        event.preventDefault();
        row.scrollBy({
          left: (event.key === 'ArrowRight' ? 1 : -1) * row.clientWidth * 0.8,
          behavior: reduced.matches ? 'instant' : 'smooth',
        });
      },
      options,
    );
  }
  document.addEventListener('visibilitychange', sync, options);
  reduced.addEventListener(
    'change',
    () => {
      paused = reduced.matches;
      sync();
    },
    options,
  );
  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      sync();
    },
    { threshold: 0.1 },
  );
  observer.observe(gallery);
  sync();
  return () => {
    cancelAnimationFrame(frame);
    controller.abort();
    observer.disconnect();
  };
}
