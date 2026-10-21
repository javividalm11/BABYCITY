export const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export const money = (n) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n);
export async function api(url, method = 'GET', data) {
  const r = await fetch(url, {
    method,
    headers: data ? { 'Content-Type': 'application/json' } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  const b = await r.json();
  if (!r.ok) throw new Error(b.error || 'No se pudo completar la solicitud.');
  return b;
}
export const notify = (message) => {
  const t = document.querySelector('#toast');
  t.textContent = message;
  t.classList.add('show');
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => t.classList.remove('show'), 3200);
};
