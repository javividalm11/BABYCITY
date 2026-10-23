import { renderChatShell, renderChatMessage } from '../components/chat.js';
import { getChatReply } from '../content/chat-replies.js';
import { products, catalogs, shipping, favorites } from '../state/store.js';

let dispose = () => {};

export function initializeChat() {
  dispose();
  const dialog = document.querySelector('#chatDialog');
  const launcher = document.querySelector('.contact-float');
  if (!dialog || !launcher) return;
  dialog.innerHTML = renderChatShell();
  const controller = new AbortController();
  const { signal } = controller;
  const input = dialog.querySelector('#chatInput');
  const log = dialog.querySelector('#chatMessages');
  const scroll = dialog.querySelector('.chat-scroll');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function close(restoreFocus = false) {
    if (!dialog.open) return;
    dialog.close();
    if (restoreFocus && !launcher.inert) launcher.focus({ preventScroll: true });
  }
  function submit(text) {
    const message = text.trim().slice(0, 500);
    if (!message) return;
    const reply = getChatReply(message, { products, catalogs, shipping });
    log.insertAdjacentHTML(
      'beforeend',
      renderChatMessage('user', message) +
        renderChatMessage('assistant', reply.text, reply, favorites),
    );
    while (log.children.length > 40) log.firstElementChild.remove();
    input.value = '';
    requestAnimationFrame(() =>
      scroll.scrollTo({
        top: scroll.scrollHeight,
        behavior: reducedMotion.matches ? 'instant' : 'smooth',
      }),
    );
  }

  launcher.addEventListener(
    'click',
    () => {
      if (dialog.open) return close(true);
      dialog.show();
      launcher.setAttribute('aria-expanded', 'true');
      dialog.querySelector('#chatClose').focus({ preventScroll: true });
    },
    { signal },
  );
  dialog.addEventListener('close', () => launcher.setAttribute('aria-expanded', 'false'), {
    signal,
  });
  dialog.querySelector('#chatClose').addEventListener('click', () => close(true), { signal });
  dialog.querySelector('#chatForm').addEventListener(
    'submit',
    (event) => {
      event.preventDefault();
      submit(input.value);
    },
    { signal },
  );
  dialog.addEventListener(
    'click',
    (event) => {
      const question = event.target.closest('[data-chat-question]');
      if (question) submit(question.dataset.chatQuestion);
      if (event.target.closest('[data-chat-handoff]')) close();
      if (event.target.closest('[data-chat-emoji]')) {
        if (input.value.length < 498) input.value += ' ♡';
        input.focus();
      }
    },
    { signal },
  );
  document.addEventListener(
    'keydown',
    (event) => {
      if (dialog.open && event.key === 'Escape') {
        event.preventDefault();
        close(true);
      }
    },
    { signal },
  );
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (dialog.open && !dialog.contains(event.target) && !launcher.contains(event.target))
        close();
    },
    { signal },
  );
  dispose = () => {
    controller.abort();
    close();
  };
}
