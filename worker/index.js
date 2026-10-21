// BabyCity en Cloudflare Workers: D1 (datos), R2 (imágenes subidas y PDFs) y ASSETS (carpeta public/).
// Equivale a server.mjs, que se conserva para desarrollo local con Node.
import seedProducts from '../data/products.json';

const enc = new TextEncoder();
const fail = (status, message) => Object.assign(new Error(message), { status });
const text = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const randomHex = (n) => hex(crypto.getRandomValues(new Uint8Array(n)));
const sha = async (s) => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const round2 = (n) => Math.round(n * 100) / 100;

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
const mimeOf = (name) => MIME[name.slice(name.lastIndexOf('.')).toLowerCase()] || 'application/octet-stream';
const SPA_ROUTE = /^\/(?:tienda|catalogos|nosotros|contacto|favoritos|admin|reclamaciones|producto\/\d+|legal\/(?:terminos|privacidad|devoluciones))?\/?$/;
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; frame-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'";

// ---------- Contraseñas (PBKDF2; scrypt no existe en Workers) ----------
async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 100000 }, key, 256));
}
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

// ---------- Base de datos: se crea y se carga sola la primera vez ----------
const SCHEMA = [
  'CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY, data TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS admins(username TEXT PRIMARY KEY, salt TEXT NOT NULL, hash TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY, expires INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY, created TEXT NOT NULL, status TEXT NOT NULL, data TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS leads(id TEXT PRIMARY KEY, created TEXT NOT NULL, data TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS claims(id TEXT PRIMARY KEY, created TEXT NOT NULL, data TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS settings(id INTEGER PRIMARY KEY, data TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS rate_limits(k TEXT PRIMARY KEY, n INTEGER NOT NULL, until INTEGER NOT NULL)',
];
let ready;
function init(env) {
  ready ||= (async () => {
    const db = env.DB;
    await db.batch(SCHEMA.map((s) => db.prepare(s)));
    const { n } = await db.prepare('SELECT count(*) n FROM products').first();
    if (!n) await db.batch(seedProducts.map((p) => db.prepare('INSERT INTO products VALUES (?,?)').bind(p.id, JSON.stringify(p))));
    await db.prepare('INSERT OR IGNORE INTO settings VALUES (1,?)').bind(JSON.stringify({ lima: null, province: null })).run();
    // La cuenta administradora sale de los secretos ADMIN_USER / ADMIN_PASSWORD del Worker.
    // Cambiar el secreto restablece la contraseña e invalida las sesiones.
    const pw = env.ADMIN_PASSWORD;
    if (typeof pw === 'string' && pw.length >= 14) {
      const username = text(env.ADMIN_USER, 100) || 'admin';
      const row = await db.prepare('SELECT * FROM admins WHERE username=?').bind(username).first();
      if (!row || !safeEqual(await hashPassword(pw, row.salt), row.hash)) {
        const salt = randomHex(32);
        await db.batch([
          db.prepare('DELETE FROM admins').bind(),
          db.prepare('INSERT INTO admins VALUES (?,?,?)').bind(username, salt, await hashPassword(pw, salt)),
          db.prepare('DELETE FROM sessions').bind(),
        ]);
      }
    }
  })().catch((e) => { ready = undefined; throw e; });
  return ready;
}

// ---------- Validaciones ----------
function customer(data) {
  const name = text(data.name, 120), phone = text(data.phone, 20);
  if (name.length < 2 || !/^\+?[0-9\s-]{9,18}$/.test(phone) || data.consent !== true) throw fail(400, 'Completa nombre, celular y autorización de privacidad.');
  return { name, phone, consent: true, consentVersion: '2026-10-20', email: text(data.email, 160), address: text(data.address, 300) };
}
function validateProduct(p, id) {
  if (!text(p.name, 180) || !text(p.category, 80) || !Number.isFinite(p.price) || p.price < 0 || p.price > 100000 || !(p.stock === null || (Number.isInteger(p.stock) && p.stock >= 0 && p.stock <= 100000))) throw fail(400, 'Revisa nombre, categoría, precio y stock.');
  const image = text(p.image, 500);
  if (!/^\/assets\/[\w/.-]+\.(webp|png|jpg|jpeg)$/.test(image)) throw fail(400, 'Selecciona una imagen de la biblioteca.');
  return { id, sku: text(p.sku, 60) || `BC-${String(id).padStart(4, '0')}`, name: text(p.name, 180), category: text(p.category, 80), price: round2(p.price), stock: p.stock, active: p.active !== false, image, description: text(p.description, 3000), catalogId: text(p.catalogId, 40), sourcePage: Number.isInteger(p.sourcePage) ? p.sourcePage : null };
}
async function readBody(request) {
  const raw = await request.text();
  if (raw.length > 2_000_000) throw fail(413, 'Archivo demasiado grande.');
  try { return JSON.parse(raw || '{}'); } catch { throw fail(400, 'Solicitud inválida.'); }
}
async function rate(env, request, key, max) {
  const now = Date.now(), k = `${request.headers.get('CF-Connecting-IP') || 'local'}:${key}`;
  let r = await env.DB.prepare('SELECT n, until FROM rate_limits WHERE k=?').bind(k).first();
  if (!r || now > r.until) r = { n: 0, until: now + 900000 };
  r.n++;
  await env.DB.prepare('INSERT OR REPLACE INTO rate_limits VALUES (?,?,?)').bind(k, r.n, r.until).run();
  if (r.n > max) throw fail(429, 'Demasiados intentos. Vuelve a intentar en 15 minutos.');
}
const sessionToken = (request) => /\bbc_session=([a-f0-9]+)/.exec(request.headers.get('Cookie') || '')?.[1];
async function isAdmin(env, request) {
  const token = sessionToken(request);
  if (!token) return false;
  return !!(await env.DB.prepare('SELECT hash FROM sessions WHERE hash=? AND expires>?').bind(await sha(token), Date.now()).first());
}
function sameOrigin(request, url) {
  if (request.headers.get('Sec-Fetch-Site') === 'cross-site') throw fail(403, 'Origen no permitido.');
  const origin = request.headers.get('Origin');
  if (origin && origin !== url.origin) throw fail(403, 'Origen no permitido.');
}
const json = (status, data, headers = {}) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });
const parseRows = (rows) => rows.results.map((r) => ({ ...r, data: JSON.parse(r.data) }));
const allProducts = async (env) => (await env.DB.prepare('SELECT data FROM products ORDER BY id').all()).results.map((r) => JSON.parse(r.data));
const getSettings = async (env) => JSON.parse((await env.DB.prepare('SELECT data FROM settings WHERE id=1').first()).data);

// ---------- HTML con SEO por ruta ----------
async function htmlDocument(env, url, route) {
  let html = await (await env.ASSETS.fetch(new Request(new URL('/index.html', url)))).text();
  const origin = (env.SITE_URL || '').replace(/\/$/, '');
  const names = { '/tienda': 'Tienda', '/catalogos': 'Catálogos interactivos', '/contacto': 'Contacto y tienda física', '/nosotros': 'Nosotros', '/legal/terminos': 'Términos y condiciones', '/legal/privacidad': 'Política de privacidad', '/legal/devoluciones': 'Cambios y devoluciones', '/reclamaciones': 'Libro de Reclamaciones', '/admin': 'Administración', '/favoritos': 'Mis favoritos' };
  let schema = { '@context': 'https://schema.org', '@type': 'Store', name: 'BabyCity', legalName: 'GRUPO BABY STORE S.A.C.', taxID: '20614491036', telephone: '+51937473120', address: { '@type': 'PostalAddress', streetAddress: 'Jr. Antonio Raymondi 512', addressLocality: 'La Victoria', addressRegion: 'Lima', addressCountry: 'PE' }, sameAs: ['https://www.tiktok.com/@babycityperu', 'https://www.falabella.com.pe/falabella-pe/seller/BABY%20STORE'], ...(origin ? { url: origin } : {}) };
  const id = /^\/producto\/(\d+)$/.exec(route)?.[1];
  const p = id && (await allProducts(env)).find((x) => x.id === Number(id) && x.active);
  const title = p ? p.name : names[route];
  if (title) html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)} · BabyCity Perú</title>`);
  if (p) {
    schema = { '@context': 'https://schema.org', '@type': 'Product', name: p.name, sku: p.sku, description: p.description, ...(origin ? { image: origin + p.image } : {}), offers: { '@type': 'Offer', price: p.price, priceCurrency: 'PEN', ...(origin ? { url: origin + route } : {}), ...(p.stock !== null ? { availability: 'https://schema.org/' + (p.stock > 0 ? 'InStock' : 'OutOfStock') } : {}) } };
    html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHtml(p.name + ' en BabyCity Perú. ' + p.description.slice(0, 140))}">`);
    html = html.replace('<div class="loading">Preparando un mundo de pequeños descubrimientos…</div>', `<article class="container section"><h1>${escapeHtml(p.name)}</h1><img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" width="300"><p>${escapeHtml(p.description)}</p><p>S/ ${p.price.toFixed(2)} · ${p.stock === null ? 'Disponibilidad por confirmar' : p.stock === 0 ? 'Agotado' : 'Disponible'}</p><a href="https://wa.me/51937473120">Consultar por WhatsApp</a></article>`);
  }
  const extra = `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>${origin ? `<link rel="canonical" href="${escapeHtml(origin + route)}"><meta property="og:url" content="${escapeHtml(origin + route)}">` : ''}<meta property="og:title" content="${escapeHtml((title || 'El mundo de tu bebé, a un clic') + ' · BabyCity Perú')}"><meta property="og:type" content="website">${['/admin', '/favoritos'].includes(route) ? '<meta name="robots" content="noindex,nofollow">' : ''}`;
  return html.replace('</head>', extra + '</head>');
}

// ---------- API ----------
async function api(request, env, url, route) {
  const method = request.method;
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) sameOrigin(request, url);
  if (route.startsWith('/api/admin/') && route !== '/api/admin/login' && !(await isAdmin(env, request))) throw fail(401, 'Inicia sesión para continuar.');
  const db = env.DB;
  const secure = url.protocol === 'https:' ? '; Secure' : '';

  if (route === '/api/products' && method === 'GET') return json(200, (await allProducts(env)).filter((p) => p.active));
  if (route === '/api/settings' && method === 'GET') return json(200, await getSettings(env));

  if (route === '/api/admin/login' && method === 'POST') {
    await rate(env, request, 'login', 10);
    const b = await readBody(request);
    const a = await db.prepare('SELECT * FROM admins WHERE username=?').bind(text(b.username, 100)).first();
    const actual = await hashPassword(String(b.password || '').slice(0, 1000), a?.salt || 'dummy');
    if (!a || !safeEqual(actual, a.hash)) throw fail(401, 'Usuario o contraseña incorrectos.');
    const token = randomHex(32);
    await db.batch([db.prepare('DELETE FROM sessions WHERE expires<?').bind(Date.now()), db.prepare('INSERT INTO sessions VALUES (?,?)').bind(await sha(token), Date.now() + 28800000)]);
    return json(200, { ok: true }, { 'Set-Cookie': `bc_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${secure}` });
  }
  if (route === '/api/admin/logout' && method === 'POST') {
    const t = sessionToken(request);
    if (t) await db.prepare('DELETE FROM sessions WHERE hash=?').bind(await sha(t)).run();
    return json(200, { ok: true }, { 'Set-Cookie': 'bc_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
  }
  if (route === '/api/admin/dashboard' && method === 'GET') {
    const [orders, leads, claims] = await Promise.all(['orders', 'leads', 'claims'].map((t) => db.prepare(`SELECT * FROM ${t} ORDER BY created DESC`).all()));
    return json(200, { products: await allProducts(env), settings: await getSettings(env), orders: parseRows(orders), leads: parseRows(leads), claims: parseRows(claims) });
  }
  if (route === '/api/admin/images' && method === 'POST') {
    const b = await readBody(request);
    if (typeof b.base64 !== 'string' || b.base64.length > 1_500_000) throw fail(400, 'Imagen demasiado grande (máximo 1 MB).');
    let bytes;
    try { bytes = Uint8Array.from(atob(b.base64), (c) => c.charCodeAt(0)); } catch { throw fail(400, 'Imagen inválida.'); }
    const str = (a, z) => String.fromCharCode(...bytes.subarray(a, z));
    const ext = bytes.length > 12 && [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v) ? 'png' : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? 'jpg' : bytes.length > 12 && str(0, 4) === 'RIFF' && str(8, 12) === 'WEBP' ? 'webp' : null;
    if (!ext || bytes.length > 1_048_576) throw fail(400, 'Usa una imagen PNG, JPG o WebP de hasta 1 MB.');
    const file = randomHex(16) + '.' + ext;
    await env.FILES.put('uploads/' + file, bytes, { httpMetadata: { contentType: mimeOf(file) } });
    return json(201, { image: '/assets/uploads/' + file });
  }
  if (route === '/api/admin/products' && ['PUT', 'POST'].includes(method)) {
    const b = await readBody(request);
    const id = method === 'POST' ? (await db.prepare('SELECT coalesce(max(id),0)+1 id FROM products').first()).id : Number(b.id);
    if (method === 'PUT' && !(await db.prepare('SELECT id FROM products WHERE id=?').bind(id).first())) throw fail(404, 'Producto no encontrado.');
    const p = validateProduct(b, id);
    await db.prepare('INSERT OR REPLACE INTO products VALUES (?,?)').bind(id, JSON.stringify(p)).run();
    return json(200, p);
  }
  if (route === '/api/admin/settings' && method === 'PUT') {
    const b = await readBody(request);
    for (const k of ['lima', 'province']) if (b[k] !== null && (!Number.isFinite(b[k]) || b[k] < 0 || b[k] > 10000)) throw fail(400, 'Tarifa inválida.');
    await db.prepare('UPDATE settings SET data=? WHERE id=1').bind(JSON.stringify({ lima: b.lima, province: b.province })).run();
    return json(200, { ok: true });
  }
  if (route === '/api/admin/orders' && method === 'PATCH') {
    const b = await readBody(request);
    if (!['solicitud', 'contactado', 'confirmado', 'enviado', 'completado', 'cancelado'].includes(b.status)) throw fail(400, 'Estado inválido.');
    const r = await db.prepare('UPDATE orders SET status=? WHERE id=?').bind(b.status, text(b.id, 50)).run();
    if (!r.meta.changes) throw fail(404, 'Pedido no encontrado.');
    return json(200, { ok: true });
  }
  if (route === '/api/orders' && method === 'POST') {
    await rate(env, request, 'order', 30);
    const b = await readBody(request), c = customer(b);
    if (!['pickup', 'lima', 'province'].includes(b.delivery)) throw fail(400, 'Selecciona la entrega.');
    if (b.delivery !== 'pickup' && !c.address) throw fail(400, 'Indica la dirección y ciudad de entrega.');
    if (!Array.isArray(b.items) || !b.items.length || b.items.length > 50) throw fail(400, 'Tu carrito está vacío o supera 50 productos.');
    const seen = new Set(), items = [];
    for (const i of b.items) {
      if (seen.has(i.id)) throw fail(400, 'Producto duplicado.');
      seen.add(i.id);
      const row = await db.prepare('SELECT data FROM products WHERE id=?').bind(Number(i.id)).first();
      const p = row && JSON.parse(row.data);
      if (!p || !p.active || !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 99 || (p.stock !== null && p.stock < i.quantity)) throw fail(409, 'La disponibilidad cambió. Actualiza tu carrito.');
      items.push({ id: p.id, name: p.name, price: p.price, quantity: i.quantity, stockConfirmed: p.stock !== null });
    }
    const subtotal = round2(items.reduce((s, i) => s + i.price * i.quantity, 0));
    const shipping = b.delivery === 'pickup' ? 0 : (await getSettings(env))[b.delivery];
    const total = shipping === null ? null : round2(subtotal + shipping);
    const id = 'BC-' + randomHex(5).toUpperCase();
    const order = { customer: c, items, subtotal, shipping, total, delivery: b.delivery, notes: text(b.notes, 700) };
    await db.prepare('INSERT INTO orders VALUES (?,?,?,?)').bind(id, new Date().toISOString(), 'solicitud', JSON.stringify(order)).run();
    // Una solicitud no reserva ni descuenta stock; el administrador confirma disponibilidad.
    return json(201, { id, ...order });
  }
  if (route === '/api/leads' && method === 'POST') {
    await rate(env, request, 'lead', 20);
    const b = await readBody(request), c = customer(b), message = text(b.message, 1000);
    if (!message) throw fail(400, 'Escribe tu consulta.');
    await db.prepare('INSERT INTO leads VALUES (?,?,?)').bind(randomHex(12), new Date().toISOString(), JSON.stringify({ ...c, message })).run();
    return json(201, { ok: true });
  }
  if (route === '/api/claims' && method === 'POST') {
    await rate(env, request, 'claim', 15);
    const b = await readBody(request), c = customer(b);
    if (!text(b.detail, 3000) || !text(b.request, 2000) || !['reclamo', 'queja'].includes(b.type) || !text(b.document, 30) || !c.email || !c.address) throw fail(400, 'Completa todos los datos de tu reclamación.');
    const id = 'REC-' + randomHex(6).toUpperCase();
    await db.prepare('INSERT INTO claims VALUES (?,?,?)').bind(id, new Date().toISOString(), JSON.stringify({ ...c, type: b.type, document: text(b.document, 30), detail: text(b.detail, 3000), request: text(b.request, 2000), product: text(b.product, 200) })).run();
    return json(201, { id });
  }
  throw fail(404, 'Ruta no encontrada.');
}

// ---------- Archivos: R2 (subidas y PDFs), HTML dinámico y assets estáticos ----------
async function fromR2(env, key) {
  const obj = await env.FILES.get(key);
  if (!obj) throw fail(404, 'Archivo no encontrado.');
  return new Response(obj.body, { headers: { 'Content-Type': obj.httpMetadata?.contentType || mimeOf(key), 'Cache-Control': 'public, max-age=3600' } });
}
async function site(request, env, url, route) {
  if (route === '/sitemap.xml') {
    const origin = env.SITE_URL;
    if (!origin) throw fail(503, 'Configura SITE_URL para generar el sitemap del dominio definitivo.');
    const paths = ['/', '/tienda', '/catalogos', '/nosotros', '/contacto', '/legal/terminos', '/legal/privacidad', '/legal/devoluciones', ...(await allProducts(env)).filter((p) => p.active).map((p) => '/producto/' + p.id)];
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + paths.map((p) => '<url><loc>' + origin.replace(/\/$/, '').replace(/&/g, '&amp;') + p + '</loc></url>').join('') + '</urlset>', { headers: { 'Content-Type': MIME['.xml'] } });
  }
  if (route.startsWith('/assets/uploads/')) return fromR2(env, 'uploads/' + decodeURIComponent(route.slice(16)));
  if (route.startsWith('/catalogo/')) return fromR2(env, 'catalogo/' + decodeURIComponent(route.slice(10)));
  if (SPA_ROUTE.test(route) || route === '/index.html') {
    const html = await htmlDocument(env, url, route === '/index.html' ? '/' : route);
    return new Response(request.method === 'HEAD' ? null : html, { headers: { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-cache' } });
  }
  const res = await env.ASSETS.fetch(request);
  if (res.status === 404) throw fail(404, 'Archivo no encontrado.');
  const out = new Response(res.body, res);
  out.headers.set('Cache-Control', 'public, max-age=3600');
  return out;
}

export default {
  async fetch(request, env) {
    let res;
    try {
      await init(env);
      const url = new URL(request.url), route = url.pathname;
      if (route.startsWith('/api/')) res = await api(request, env, url, route);
      else if (request.method !== 'GET' && request.method !== 'HEAD') throw fail(405, 'Método no permitido.');
      else res = await site(request, env, url, route);
    } catch (e) {
      if (!e.status) console.error(e);
      res = json(e.status || 500, { error: e.status ? e.message : 'No pudimos procesar la solicitud.' });
    }
    res = new Response(res.body, res);
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.headers.set('X-Frame-Options', 'SAMEORIGIN');
    res.headers.set('Content-Security-Policy', CSP);
    return res;
  },
};
