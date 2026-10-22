import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
// Copio el motor al proyecto y saco su CSS a un archivo para cumplir la política de seguridad sin excepciones.
const source = readFileSync('node_modules/page-flip/dist/js/page-flip.module.js', 'utf8');
const start = source.indexOf('!function(t,e){void 0===e');
const end = source.indexOf('class x extends class', start);
const match = source.slice(start, end).match(/\}\(("(?:\\.|[^"\\])*")\);$/);
if (start < 0 || end < 0 || !match)
  throw new Error('Unexpected page-flip bundle; review before updating.');
mkdirSync('public/vendor', { recursive: true });
let bundle = source.slice(0, start) + source.slice(end);
// Detengo el bucle de dibujo al destruir el visor para no retener libros cerrados.
const loop =
  'start(){this.update();const t=e=>{this.render(e),requestAnimationFrame(t)};requestAnimationFrame(t)}';
const destroy = 'destroy(){this.ui.destroy(),this.block.remove()}';
if (!bundle.includes(loop) || !bundle.includes(destroy))
  throw new Error('Review the render lifecycle before updating.');
bundle = bundle.replace(
  loop,
  'start(){this.update();this._bcStopped=false;const t=e=>{if(this._bcStopped)return;this.render(e);this._bcFrame=requestAnimationFrame(t)};this._bcFrame=requestAnimationFrame(t)}stop(){this._bcStopped=true;cancelAnimationFrame(this._bcFrame)}',
);
bundle = bundle.replace(
  destroy,
  'destroy(){this.render.stop(),this.ui.destroy(),this.block.remove()}',
);
writeFileSync(
  'public/vendor/page-flip.js',
  '/*! StPageFlip 2.0.7 | MIT | https://github.com/Nodlik/StPageFlip | BabyCity: external CSS and RAF cleanup */\n' +
    bundle,
);
writeFileSync('public/vendor/page-flip.css', JSON.parse(match[1]));
writeFileSync(
  'public/vendor/page-flip-LICENSE.txt',
  readFileSync('node_modules/page-flip/LICENSE', 'utf8'),
);
