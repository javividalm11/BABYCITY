import { notify } from '../lib/notify.js';

const MAX_QUANTITY = 99;
const CART_KEY = 'bc-cart-v2';
const FAVORITES_KEY = 'bc-favorites';

function readStored(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

const validLine = (line) =>
  Number.isInteger(line?.id) &&
  Number.isInteger(line?.quantity) &&
  line.quantity > 0 &&
  line.quantity <= MAX_QUANTITY;

// Estado compartido. Los módulos lo leen por importación y lo cambian solo con estas funciones.
export let products = [];
export let catalogs = [];
export let shipping = { lima: null, province: null };
export let shopPage = 1;
export let cart = [].concat(readStored(CART_KEY, [])).filter(validLine);
export let favorites = [].concat(readStored(FAVORITES_KEY, [])).filter(Number.isInteger);

export function persist() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch {
    // El navegador puede bloquear el almacenamiento; la tienda sigue funcionando sin él.
  }
  const badge = document.querySelector('#cartCount');
  if (badge) badge.textContent = cart.reduce((sum, line) => sum + line.quantity, 0);
  document.dispatchEvent(new Event('bc-cart-change'));
}

export function setStoreData(data) {
  products = data.products ?? products;
  catalogs = data.catalogs ?? catalogs;
  shipping = data.shipping ?? shipping;
}

export const setShopPage = (page) => {
  shopPage = page;
};

// Quito del carrito lo que ya no existe en el catálogo.
export function pruneCart() {
  cart = cart.filter((line) => products.some((p) => p.id === line.id));
  persist();
}

export function addToCart(id) {
  const product = products.find((p) => p.id === id);
  if (!product || product.stock === 0) return notify('Este producto está agotado.');
  const line = cart.find((l) => l.id === id);
  if (!line) cart = [...cart, { id, quantity: 1 }];
  else if (
    line.quantity >= MAX_QUANTITY ||
    (product.stock !== null && line.quantity >= product.stock)
  ) {
    return notify('Alcanzaste la cantidad disponible.');
  } else cart = cart.map((l) => (l.id === id ? { ...l, quantity: l.quantity + 1 } : l));
  persist();
  notify('Agregado a tu carrito ♡');
}

// Devuelvo un mensaje si no se puede cambiar la cantidad; si todo salió bien, devuelvo null.
export function changeQuantity(id, delta) {
  const line = cart.find((l) => l.id === id);
  const product = products.find((p) => p.id === id);
  if (!line || !product) return 'Este producto ya no está disponible.';
  const next = line.quantity + delta;
  if (next > MAX_QUANTITY || (product.stock !== null && next > product.stock)) {
    return 'No hay más unidades confirmadas.';
  }
  cart =
    next <= 0
      ? cart.filter((l) => l.id !== id)
      : cart.map((l) => (l.id === id ? { ...l, quantity: next } : l));
  persist();
  return null;
}

export function removeFromCart(id) {
  cart = cart.filter((line) => line.id !== id);
  persist();
}

export function clearCart() {
  cart = [];
  persist();
}

// Devuelvo true si el producto quedó guardado en favoritos.
export function toggleFavorite(id) {
  favorites = favorites.includes(id) ? favorites.filter((x) => x !== id) : [...favorites, id];
  persist();
  return favorites.includes(id);
}
