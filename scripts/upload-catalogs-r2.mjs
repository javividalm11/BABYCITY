// Sube los PDF de catalogo/ al bucket R2 (se sirven en /catalogo/...). Uso: npm run cf:upload-pdfs
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const bucket = process.env.R2_BUCKET || 'babycity-files';
const local = process.argv.includes('--local');
for (const f of readdirSync('catalogo').filter((n) => n.toLowerCase().endsWith('.pdf'))) {
  console.log('Subiendo', f);
  const r = spawnSync('npx', ['wrangler', 'r2', 'object', 'put', `${bucket}/catalogo/${f}`, '--file', `catalogo/${f}`, '--content-type', 'application/pdf', local ? '--local' : '--remote'], { stdio: 'inherit', shell: true });
  if (r.status) process.exit(r.status);
}
