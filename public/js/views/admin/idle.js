import { IDLE_MS } from './state.js';

const EVENTS = ['pointerdown', 'keydown', 'scroll'];
let timer = null;
let reset = null;

// Cierro la sesión de pantalla si nadie toca el panel durante un rato.
export function startIdleWatch(onIdle) {
  stopIdleWatch();
  reset = () => {
    clearTimeout(timer);
    timer = setTimeout(onIdle, IDLE_MS);
  };
  EVENTS.forEach((name) => window.addEventListener(name, reset, { passive: true }));
  reset();
}

export function stopIdleWatch() {
  clearTimeout(timer);
  if (reset) EVENTS.forEach((name) => window.removeEventListener(name, reset));
  reset = null;
}
