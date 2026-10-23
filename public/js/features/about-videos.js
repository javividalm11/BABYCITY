const PLAYER = 'https://www.tiktok.com/player/v1';
const ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share';

let dispose = () => {};

export function destroyAboutVideos() {
  dispose();
  dispose = () => {};
}

function playerFor(id, label) {
  const frame = document.createElement('iframe');
  frame.src = `${PLAYER}/${id}?autoplay=1&rel=0&description=0&music_info=0`;
  frame.title = label;
  frame.allow = ALLOW;
  frame.allowFullscreen = true;
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  return frame;
}

// Cargo el reproductor solo cuando alguien pulsa la portada, y dejo un solo video activo.
export function mountAboutVideos(root) {
  destroyAboutVideos();
  const controller = new AbortController();
  const posters = new Map();

  function restore(frame) {
    const slot = frame.parentElement;
    const poster = posters.get(slot);
    if (!poster) return;
    frame.replaceWith(poster);
    posters.delete(slot);
  }

  function play(button) {
    const id = button.dataset.tiktokPlay;
    if (!/^\d{10,25}$/.test(id)) return;
    root.querySelectorAll('.about-video-frame iframe').forEach(restore);
    const slot = button.parentElement;
    const player = playerFor(id, button.getAttribute('aria-label').replace('Reproducir', 'Video'));
    posters.set(slot, button);
    button.replaceWith(player);
    player.focus();
  }

  root.addEventListener(
    'click',
    (event) => {
      const button = event.target.closest('[data-tiktok-play]');
      if (button && root.contains(button)) play(button);
    },
    { signal: controller.signal },
  );
  dispose = () => controller.abort();
}
