const HTML_ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const currency = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

// Escapo todo texto dinámico antes de insertarlo en una plantilla HTML.
export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => HTML_ENTITIES[c]);

export const money = (amount) => currency.format(amount);
