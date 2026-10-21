export const encoder = new TextEncoder();

export const toHex = (buffer) =>
  [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');

export const randomHex = (bytes) => toHex(crypto.getRandomValues(new Uint8Array(bytes)));

export const sha256Hex = async (text) =>
  toHex(await crypto.subtle.digest('SHA-256', encoder.encode(text)));

// Comparo en tiempo constante para no filtrar información por la duración.
export function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
