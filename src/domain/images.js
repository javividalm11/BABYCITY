const PNG = [137, 80, 78, 71, 13, 10, 26, 10];
const ascii = (bytes, from, to) => String.fromCharCode(...bytes.subarray(from, to));

// Identifico el formato por su firma real y no por lo que declare el cliente.
export function detectImageType(bytes) {
  if (bytes.length < 12) return null;
  if (PNG.every((value, i) => bytes[i] === value)) return 'png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'jpg';
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') return 'webp';
  return null;
}

export const IMAGE_MIME = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };

export function decodeBase64(value) {
  try {
    return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}
