const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "font-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self'",
  'frame-src https://www.google.com',
  "manifest-src 'self'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join('; ');

const PERMISSIONS =
  'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()';

// Devuelvo una copia de la respuesta con las cabeceras de seguridad aplicadas.
export function withSecurityHeaders(response, url) {
  const res = new Response(response.body, response);
  const h = res.headers;
  const secure = url.protocol === 'https:';
  h.set('Content-Security-Policy', secure ? `${CSP}; upgrade-insecure-requests` : CSP);
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('X-Frame-Options', 'DENY');
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  h.set('Permissions-Policy', PERMISSIONS);
  h.set('Cross-Origin-Opener-Policy', 'same-origin');
  h.set('Cross-Origin-Resource-Policy', 'same-origin');
  if (secure) h.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  if (url.pathname.startsWith('/api/') || url.pathname === '/admin') {
    h.set('Cache-Control', 'no-store');
    h.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return res;
}
