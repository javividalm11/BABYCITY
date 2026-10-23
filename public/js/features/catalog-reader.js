import { PageFlip } from '../../vendor/page-flip.js';

import { readerShell } from '../components/reader-shell.js';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const zoomLevels = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export class CatalogReader {
  constructor(dialog) {
    this.dialog = dialog;
    this.root = dialog.querySelector('#bookContent');
    this.engine = null;
    this.index = 0;
    this.zoomed = false;
    this.version = 0;
    dialog.addEventListener('close', () => {
      if (!dialog.open) {
        this.version++;
        this.dispose();
      }
    });
    dialog.addEventListener('click', (e) => {
      const thumbnail = e.target.closest('[data-reader-page]');
      if (thumbnail) this.go(Number(thumbnail.dataset.readerPage));
      const button = e.target.closest('[data-reader-action]');
      if (!button) return;
      switch (button.dataset.readerAction) {
        case 'previous':
          this.turn(-1);
          break;
        case 'next':
          this.turn(1);
          break;
        case 'first':
          this.go(0);
          break;
        case 'last':
          this.go(this.catalog.count - 1);
          break;
        case 'zoom':
          this.stepZoom(1);
          break;
        case 'zoom-out':
          this.stepZoom(-1);
          break;
        case 'single':
        case 'double':
          this.pageMode = button.dataset.readerAction;
          this.dismissGesture();
          this.mount();
          break;
        case 'pages':
        case 'bookmarks':
          this.showSidebar(button.dataset.readerAction === 'bookmarks');
          break;
        case 'bookmark': {
          const saved = this.bookmarks.get(this.catalog.id) || new Set();
          if (saved.has(this.index)) saved.delete(this.index);
          else saved.add(this.index);
          this.bookmarks.set(this.catalog.id, saved);
          this.renderThumbnails();
          break;
        }
        case 'fullscreen':
          this.fullscreen();
          break;
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.defaultPrevented || !dialog.open || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName))
        return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.turn(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.turn(-1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        this.go(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        this.go(this.catalog.count - 1);
      }
    });
    this.observer = new ResizeObserver(() => {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => this.resize(), 120);
    });
    document.addEventListener('fullscreenchange', () => {
      if (this.readerFullscreen && !document.fullscreenElement) {
        this.readerFullscreen = false;
        this.setExpanded(false);
      }
      this.resize();
    });
    dialog.addEventListener('cancel', (event) => {
      if (!this.dialog.classList.contains('is-fullscreen')) return;
      event.preventDefault();
      this.fullscreen();
    });
  }
  async open(catalog, page = 1) {
    const version = ++this.version;
    this.dispose();
    this.catalog = catalog;
    this.index = Math.max(0, Math.min(catalog.count - 1, Number(page) - 1));
    this.zoomed = false;
    this.zoom = 1;
    this.pageMode = 'auto';
    this.bookmarks ??= new Map();
    this.bookmarkView = false;
    this.root.innerHTML = readerShell(catalog, this.index);
    this.dialog.setAttribute('aria-labelledby', 'readerTitle');
    if (!this.dialog.open) this.dialog.showModal();
    this.stage = this.root.querySelector('#bookStage');
    this.syncZoomControls();
    this.slider = this.root.querySelector('#bookSlider');
    this.slider.addEventListener('input', (e) => this.go(Number(e.target.value) - 1));
    this.root.querySelector('#readerGoForm').addEventListener('submit', (event) => {
      event.preventDefault();
      this.go(Number(this.root.querySelector('#readerPageInput').value) - 1);
    });
    this.root
      .querySelector('#readerZoom')
      .addEventListener('change', (event) => this.setZoom(Number(event.target.value)));
    this.root.querySelector('#readerSearch').addEventListener('input', (event) => {
      const query = event.target.value.trim();
      this.root.querySelectorAll('.reader-thumbnail').forEach((button) => {
        const start = Number(button.dataset.readerPage) + 1;
        button.hidden =
          query !== '' && !(Number(query) >= start && Number(query) < start + this.sides);
      });
    });
    this.root.querySelector('#readerSearch').addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      const page = Number(event.target.value);
      if (Number.isInteger(page) && page >= 1 && page <= this.catalog.count) this.go(page - 1);
    });
    this.root.querySelector('.reader-tabs').addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      this.showSidebar(event.key === 'End' || (event.key !== 'Home' && !this.bookmarkView));
      this.root.querySelector('[role="tab"][aria-selected="true"]').focus();
    });
    this.stage.addEventListener('pointerdown', () => this.dismissGesture(), { once: true });
    let pan = null;
    this.stage.addEventListener('pointerdown', (event) => {
      if (!this.zoomed || event.button !== 0 || !event.target.closest('.reader-book')) return;
      event.preventDefault();
      pan = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        left: this.stage.scrollLeft,
        top: this.stage.scrollTop,
      };
      this.stage.setPointerCapture(event.pointerId);
      this.stage.classList.add('is-panning');
    });
    this.stage.addEventListener('pointermove', (event) => {
      if (!pan || event.pointerId !== pan.id) return;
      this.stage.scrollLeft = pan.left - (event.clientX - pan.x);
      this.stage.scrollTop = pan.top - (event.clientY - pan.y);
    });
    this.stage.addEventListener('lostpointercapture', () => {
      pan = null;
      this.stage.classList.remove('is-panning');
    });
    this.stage.addEventListener(
      'wheel',
      (event) => {
        if (
          this.zoomed ||
          Math.abs(event.deltaX) < 15 ||
          Math.abs(event.deltaX) <= Math.abs(event.deltaY)
        )
          return;
        event.preventDefault();
        if (performance.now() - (this.lastWheel || 0) < 900) return;
        this.lastWheel = performance.now();
        this.dismissGesture();
        this.turn(event.deltaX > 0 ? 1 : -1);
      },
      { passive: false },
    );
    const image = new Image();
    image.src = catalog.pages[0];
    try {
      await image.decode();
      this.ratio = image.naturalHeight / image.naturalWidth;
    } catch {
      this.ratio = Math.SQRT2;
    }
    if (version !== this.version || !this.dialog.open) return;
    this.mount();
    this.observer.observe(this.stage);
  }
  dimensions() {
    // El área de ajuste no cambia cuando aparecen las barras de desplazamiento.
    const { width, height } = this.stage.getBoundingClientRect();
    const sides = this.pageMode !== 'single' && width >= 680 ? 2 : 1;
    let pageWidth = Math.max(100, Math.min((width - 30) / sides, (height - 24) / this.ratio));
    pageWidth *= this.zoom;
    return {
      pageWidth: Math.floor(pageWidth),
      pageHeight: Math.floor(pageWidth * this.ratio),
      sides,
    };
  }
  mount() {
    const host = this.root.querySelector('#readerBook');
    if (this.engine) this.engine.destroy();
    // El motor elimina su contenedor al destruirse; recreo uno limpio.
    const book = host?.isConnected ? host : document.createElement('div');
    book.id = 'readerBook';
    book.className = 'reader-book';
    if (!book.isConnected) this.stage.append(book);
    const { pageWidth, pageHeight, sides } = this.dimensions();
    this.layout = `${pageWidth}:${pageHeight}:${sides}:${this.zoom}`;
    this.sides = sides;
    book.style.width = `${pageWidth * sides}px`;
    book.style.height = `${pageHeight}px`;
    this.root
      .querySelector('[data-reader-action="single"]')
      .setAttribute('aria-pressed', sides === 1);
    this.root
      .querySelector('[data-reader-action="double"]')
      .setAttribute('aria-pressed', sides === 2);
    this.root.querySelector('[data-reader-action="double"]').disabled =
      this.stage.clientWidth < 680;
    book.replaceChildren(
      ...this.catalog.pages.map((src, i) => {
        const sheet = document.createElement('div');
        sheet.className = 'reader-sheet';
        sheet.dataset.pageIndex = i;
        const image = document.createElement('img');
        image.className = 'reader-page-image';
        image.src = src;
        image.alt = `${this.catalog.title}, página ${i + 1}`;
        image.draggable = false;
        image.decoding = 'async';
        sheet.append(image);
        return sheet;
      }),
    );
    // Ajusto las páginas por alto y ancho; el modo vertical depende del ancho para que el zoom no cambie el emparejado.
    this.engine = new PageFlip(book, {
      width: pageWidth,
      height: pageHeight,
      size: 'fixed',
      startPage: this.index,
      drawShadow: true,
      maxShadowOpacity: 0.45,
      flippingTime: reduced() ? 1 : 850,
      usePortrait: sides === 1,
      showCover: false,
      autoSize: false,
      mobileScrollSupport: false,
      swipeDistance: 35,
      showPageCorners: !reduced(),
      disableFlipByClick: false,
      useMouseEvents: !this.zoomed,
    });
    this.engine.on('flip', () => {
      if (this.engine.getCurrentPageIndex() !== this.index) this.dismissGesture();
      this.sync();
    });
    this.engine.on('init', () => {
      if (this.dialog.open && this.engine) {
        this.sync();
        this.ready();
      }
    });
    this.engine.on('changeState', (e) =>
      this.stage.classList.toggle('is-turning', e.data !== 'read'),
    );
    this.stage.setAttribute('aria-busy', 'true');
    this.engine.loadFromHTML(book.querySelectorAll('.reader-sheet'));
    this.stage.classList.toggle('reader-zoomed', this.zoomed);
    this.renderThumbnails();
    this.sync();
  }
  async ready() {
    const engine = this.engine;
    const images = [...this.root.querySelectorAll('.reader-sheet[aria-hidden="false"] img')];
    await Promise.all(images.map((image) => image.decode().catch(() => {})));
    if (this.dialog.open && this.engine === engine) this.stage.setAttribute('aria-busy', 'false');
  }
  sync() {
    if (!this.engine) return;
    this.index = this.engine.getCurrentPageIndex();
    const end = Math.min(this.catalog.count, this.index + this.sides);
    this.slider.value = this.index + 1;
    this.root.querySelector('#readerPageInput').value = this.index + 1;
    this.syncThumbnails();
    this.root.querySelector('#readerPageLabel').textContent =
      `${this.index + 1}${end > this.index + 1 ? '–' + end : ''} / ${this.catalog.count}`;
    this.root
      .querySelectorAll('[data-reader-action="previous"],[data-reader-action="first"]')
      .forEach((b) => (b.disabled = this.index === 0));
    this.root
      .querySelectorAll('[data-reader-action="next"],[data-reader-action="last"]')
      .forEach((b) => (b.disabled = end >= this.catalog.count));
    this.root
      .querySelectorAll('.reader-sheet')
      .forEach((s) =>
        s.setAttribute(
          'aria-hidden',
          Number(s.dataset.pageIndex) < this.index || Number(s.dataset.pageIndex) >= end
            ? 'true'
            : 'false',
        ),
      );
  }
  turn(direction) {
    if (!this.engine || this.engine.getState() !== 'read') return;
    const end = this.index + this.sides;
    if ((direction < 0 && this.index === 0) || (direction > 0 && end >= this.catalog.count)) return;
    if (reduced()) {
      direction > 0 ? this.engine.turnToNextPage() : this.engine.turnToPrevPage();
    } else direction > 0 ? this.engine.flipNext('bottom') : this.engine.flipPrev('bottom');
  }
  go(index) {
    if (!this.engine) return;
    this.dismissGesture();
    this.engine.turnToPage(Math.max(0, Math.min(this.catalog.count - 1, index)));
    this.sync();
  }
  stepZoom(direction) {
    const index = zoomLevels.indexOf(this.zoom);
    this.setZoom(zoomLevels[Math.max(0, Math.min(zoomLevels.length - 1, index + direction))]);
  }
  setZoom(zoom) {
    if (!this.engine || !zoomLevels.includes(zoom) || zoom === this.zoom) return;
    const book = this.root.querySelector('#readerBook');
    const viewport = this.stage.getBoundingClientRect();
    const bounds = book.getBoundingClientRect();
    const centerX = Math.max(
      0,
      Math.min(1, (viewport.left + this.stage.clientWidth / 2 - bounds.left) / bounds.width),
    );
    const centerY = Math.max(
      0,
      Math.min(1, (viewport.top + this.stage.clientHeight / 2 - bounds.top) / bounds.height),
    );
    this.zoom = zoom;
    this.zoomed = zoom > 1;
    this.syncZoomControls();
    this.dismissGesture();
    this.mount();
    const enlarged = this.root.querySelector('#readerBook').getBoundingClientRect();
    this.stage.scrollLeft +=
      enlarged.left + enlarged.width * centerX - viewport.left - this.stage.clientWidth / 2;
    this.stage.scrollTop +=
      enlarged.top + enlarged.height * centerY - viewport.top - this.stage.clientHeight / 2;
    if (!this.zoomed) {
      this.stage.scrollLeft = 0;
      this.stage.scrollTop = 0;
    }
  }
  syncZoomControls() {
    this.root.querySelector('#readerZoom').value = String(this.zoom);
    this.root.querySelector('[data-reader-action="zoom"]').disabled =
      this.zoom === zoomLevels.at(-1);
    this.root.querySelector('[data-reader-action="zoom-out"]').disabled =
      this.zoom === zoomLevels[0];
  }
  dismissGesture() {
    this.root.querySelector('.reader-gesture')?.classList.add('is-dismissed');
  }
  renderThumbnails() {
    const container = this.root.querySelector('#readerThumbnails');
    const saved = this.bookmarks.get(this.catalog.id) || new Set();
    const step = this.sides || 2;
    container.replaceChildren();
    for (let i = 0; i < this.catalog.count; i += step) {
      if (this.bookmarkView && ![...saved].some((page) => page >= i && page < i + step)) continue;
      const button = document.createElement('button');
      button.className = 'reader-thumbnail';
      button.dataset.readerPage = i;
      const end = Math.min(this.catalog.count, i + step);
      button.setAttribute(
        'aria-label',
        `Ver p\u00e1gina ${i + 1}${end > i + 1 ? ` a ${end}` : ''}`,
      );
      for (let page = i; page < end; page++) {
        const img = document.createElement('img');
        img.src = this.catalog.pages[page];
        img.alt = '';
        img.loading = 'lazy';
        button.append(img);
      }
      const label = document.createElement('span');
      label.textContent = `${i + 1}${end > i + 1 ? ` \u2013 ${end}` : ''}`;
      button.append(label);
      container.append(button);
    }
    if (!container.children.length) {
      const message = document.createElement('p');
      message.className = 'reader-no-pages';
      message.textContent = this.bookmarkView
        ? 'A\u00fan no guardaste p\u00e1ginas.'
        : 'No encontramos esa p\u00e1gina.';
      container.append(message);
    }
    this.syncThumbnails();
  }
  syncThumbnails() {
    this.root.querySelectorAll('.reader-thumbnail').forEach((button) => {
      button.setAttribute(
        'aria-current',
        Number(button.dataset.readerPage) === this.index ? 'page' : 'false',
      );
    });
    const saved = this.bookmarks.get(this.catalog.id) || new Set();
    const button = this.root.querySelector('[data-reader-action="bookmark"]');
    button.setAttribute('aria-pressed', saved.has(this.index));
    button.querySelector('span').textContent = saved.has(this.index)
      ? 'P\u00e1gina guardada'
      : 'Guardar p\u00e1gina';
  }
  showSidebar(bookmarks) {
    this.bookmarkView = bookmarks;
    for (const tab of this.root.querySelectorAll('[role="tab"]')) {
      const selected = (tab.dataset.readerAction === 'bookmarks') === bookmarks;
      tab.setAttribute('aria-selected', selected);
      tab.tabIndex = selected ? 0 : -1;
    }
    this.root
      .querySelector('#readerThumbnails')
      .setAttribute('aria-labelledby', bookmarks ? 'readerBookmarksTab' : 'readerPagesTab');
    this.renderThumbnails();
  }
  resize() {
    if (!this.dialog.open || !this.engine) return;
    const d = this.dimensions();
    const layout = `${d.pageWidth}:${d.pageHeight}:${d.sides}:${this.zoom}`;
    if (layout !== this.layout) this.mount();
  }
  async fullscreen() {
    if (this.fullscreenPending) return;
    this.fullscreenPending = true;
    try {
      if (this.dialog.classList.contains('is-fullscreen')) {
        if (this.readerFullscreen && document.fullscreenElement) await document.exitFullscreen();
        this.readerFullscreen = false;
        this.setExpanded(false);
      } else {
        // Los navegadores no permiten requestFullscreen() sobre un elemento dialog.
        // El documento conserva el diálogo modal en su capa superior.
        if (!document.fullscreenElement && document.fullscreenEnabled) {
          await document.documentElement.requestFullscreen();
          this.readerFullscreen = true;
        }
        if (this.dialog.open) this.setExpanded(true);
        else if (this.readerFullscreen) await document.exitFullscreen();
      }
    } catch {
      // Si el navegador restringe la API, el lector ocupa toda la ventana.
      if (this.dialog.open) this.setExpanded(true);
    } finally {
      this.fullscreenPending = false;
    }
  }
  setExpanded(expanded) {
    this.dialog.classList.toggle('is-fullscreen', expanded);
    const button = this.root.querySelector('[data-reader-action="fullscreen"]');
    if (button) {
      const label = expanded ? 'Salir de pantalla completa' : 'Pantalla completa';
      button.setAttribute('aria-label', label);
      button.setAttribute('aria-pressed', String(expanded));
      button.title = label;
    }
  }
  dispose() {
    this.setExpanded(false);
    if (this.readerFullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    this.readerFullscreen = false;
    this.observer.disconnect();
    clearTimeout(this.resizeTimer);
    if (this.engine) {
      this.engine.destroy();
      this.engine = null;
    }
    this.stage?.classList.remove('is-turning', 'is-panning');
  }
}
