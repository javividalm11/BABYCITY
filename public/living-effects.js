let cleanup = () => {};
export function destroyLivingEffects() {
  cleanup();
  cleanup = () => {};
}

export function mountLivingEffects(main) {
  destroyLivingEffects();
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches || new URLSearchParams(location.search).get('efectos') === '0') return;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let wordIndex = 0;
  main.querySelectorAll('.hero-copy h1>span,.hero-copy h1>em,.hero-copy>p').forEach((line) => {
    if (line.querySelector('.hero-word')) return;
    for (const node of [...line.childNodes]) {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue;
      const fragment = document.createDocumentFragment();
      for (const part of node.textContent.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) {
          fragment.append(document.createTextNode(part));
          continue;
        }
        const mask = document.createElement('span'),
          word = document.createElement('span');
        mask.className = 'hero-word-mask';
        word.className = 'hero-word';
        word.textContent = part;
        word.style.setProperty('--word-delay', `${0.06 + wordIndex++ * 0.065}s`);
        mask.append(word);
        fragment.append(mask);
      }
      node.replaceWith(fragment);
    }
  });
  document.body.classList.add('living-enabled');
  let disposed = false,
    frame = 0,
    scanFrame = 0,
    scroll = scrollY,
    observer;
  const animations = new Set(),
    observed = new WeakSet(),
    pointer = { x: 0.5, y: 0.5 };
  const hero = main.querySelector('.hero-room img');
  function update() {
    frame = 0;
    if (disposed || document.hidden) return;
    if (hero && finePointer.matches)
      hero.style.transform = `translate3d(${(pointer.x - 0.5) * 10}px,${Math.min(scroll, innerHeight) * 0.025 + (pointer.y - 0.5) * 8}px,0) scale(1.055)`;
  }
  function requestUpdate() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  function moved(event) {
    pointer.x = event.clientX / innerWidth;
    pointer.y = 1 - event.clientY / innerHeight;
    requestUpdate();
    if (!finePointer.matches) return;
    const card = event.target.closest('.showcase-card,.category-card');
    if (!card || !main.contains(card)) return;
    const r = card.getBoundingClientRect(),
      x = (event.clientX - r.left) / r.width - 0.5,
      y = (event.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(900px) rotateX(${-y * 5}deg) rotateY(${x * 6}deg) translateY(-4px)`;
    card.classList.add('living-tilted');
  }
  function exited(event) {
    const card = event.target.closest('.showcase-card,.category-card');
    if (card && !card.contains(event.relatedTarget)) {
      card.style.removeProperty('transform');
      card.classList.remove('living-tilted');
    }
  }
  function scrolled() {
    scroll = scrollY;
    requestUpdate();
  }
  observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        const animation = entry.target.animate(
          [
            { opacity: 0, translate: '0 22px' },
            { opacity: 1, translate: '0 0' },
          ],
          {
            duration: 650,
            delay: Number(entry.target.dataset.livingOrder || 0) * 65,
            easing: 'cubic-bezier(.2,.7,.2,1)',
          },
        );
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      }),
    { threshold: 0.08 },
  );
  function scan() {
    scanFrame = 0;
    if (disposed) return;
    main
      .querySelectorAll(
        '.section-heading,.showcase-heading,.category-card,.showcase-card,.catalog-feature,.community-copy-header,.community-contact-copy',
      )
      .forEach((el, index) => {
        if (observed.has(el)) return;
        observed.add(el);
        el.dataset.livingOrder = index % 4;
        observer.observe(el);
      });
  }
  const mutations = new MutationObserver(() => {
    if (!scanFrame) scanFrame = requestAnimationFrame(scan);
  });
  mutations.observe(main, { childList: true, subtree: true });
  scan();
  function changedPreference() {
    if (preference.matches) destroyLivingEffects();
  }
  window.addEventListener('resize', requestUpdate);
  window.addEventListener('scroll', scrolled, { passive: true });
  window.addEventListener('pointermove', moved, { passive: true });
  main.addEventListener('pointerout', exited);
  document.addEventListener('visibilitychange', requestUpdate);
  preference.addEventListener('change', changedPreference);
  cleanup = () => {
    disposed = true;
    cancelAnimationFrame(frame);
    cancelAnimationFrame(scanFrame);
    observer.disconnect();
    mutations.disconnect();
    animations.forEach((a) => a.cancel());
    window.removeEventListener('resize', requestUpdate);
    window.removeEventListener('scroll', scrolled);
    window.removeEventListener('pointermove', moved);
    main.removeEventListener('pointerout', exited);
    document.removeEventListener('visibilitychange', requestUpdate);
    preference.removeEventListener('change', changedPreference);
    main.querySelectorAll('.living-tilted').forEach((el) => {
      el.style.removeProperty('transform');
      el.classList.remove('living-tilted');
    });
    hero?.style.removeProperty('transform');
    document.body.classList.remove('living-enabled');
  };
  requestUpdate();
}
