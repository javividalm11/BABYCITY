// Descargo la portada de cada video de TikTok a public/assets/about/ para servirla desde el sitio.
// Uso: node scripts/fetch-tiktok-covers.mjs <id> [<id> ...]
import { mkdirSync, writeFileSync } from 'node:fs';
import { detectImageType } from '../src/domain/images.js';

const PROFILE = 'https://www.tiktok.com/@babycityperu';
const HEADERS = {
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'accept-language': 'es-PE,es;q=0.9',
};
const DEST = 'public/assets/about';

async function coverUrl(id) {
  const page = await fetch(`${PROFILE}/video/${id}`, { headers: HEADERS });
  if (!page.ok) throw new Error(`La página del video respondió ${page.status}`);
  const match = (await page.text()).match(/"originCover":"([^"]+)"/);
  if (!match) throw new Error('No encontré la portada en la página del video');
  return JSON.parse(`"${match[1]}"`);
}

async function download(id) {
  const response = await fetch(await coverUrl(id), {
    headers: { ...HEADERS, accept: 'image/webp,image/jpeg,image/*' },
  });
  if (!response.ok) throw new Error(`La imagen respondió ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) throw new Error('El archivo descargado no es una imagen válida');
  const file = `${DEST}/tiktok-${id}.${type}`;
  writeFileSync(file, bytes);
  console.log(`${file} (${Math.round(bytes.length / 1024)} KB)`);
}

const ids = process.argv.slice(2).filter((id) => /^\d{10,25}$/.test(id));
if (!ids.length) throw new Error('Indica al menos un id de video numérico');
mkdirSync(DEST, { recursive: true });
for (const id of ids) await download(id);
