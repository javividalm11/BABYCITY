let dispose = () => {};

export function initializeContactFloat() {
  dispose();
  const button = document.querySelector('.contact-float');
  const footer = document.querySelector('.babycity-footer');
  if (!button || !footer) return;

  function setFooterVisible(visible) {
    button.classList.toggle('is-footer-hidden', visible);
    button.inert = visible;
  }

  const bounds = footer.getBoundingClientRect();
  setFooterVisible(bounds.top < innerHeight && bounds.bottom > 0);
  const observer = new IntersectionObserver(([entry]) => setFooterVisible(entry.isIntersecting));
  observer.observe(footer);
  dispose = () => {
    observer.disconnect();
    setFooterVisible(false);
  };
}
