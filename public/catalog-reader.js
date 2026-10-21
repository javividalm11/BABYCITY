import {PageFlip} from './vendor/page-flip.js';

const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

export class CatalogReader {
 constructor(dialog){
  this.dialog=dialog;this.root=dialog.querySelector('#bookContent');this.engine=null;this.index=0;this.zoomed=false;this.version=0;
  dialog.addEventListener('close',()=>{if(!dialog.open){this.version++;this.dispose();}});
  dialog.addEventListener('click',e=>{
   const button=e.target.closest('[data-reader-action]');if(!button)return;
   switch(button.dataset.readerAction){
    case 'previous':this.turn(-1);break;case 'next':this.turn(1);break;
    case 'first':this.go(0);break;case 'last':this.go(this.catalog.count-1);break;
    case 'zoom':this.toggleZoom();break;case 'fullscreen':this.fullscreen();break;
   }
  });
  document.addEventListener('keydown',e=>{
   if(!dialog.open||/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName))return;
   if(e.key==='ArrowRight'){e.preventDefault();this.turn(1);}
   else if(e.key==='ArrowLeft'){e.preventDefault();this.turn(-1);}
   else if(e.key==='Home'){e.preventDefault();this.go(0);}
   else if(e.key==='End'){e.preventDefault();this.go(this.catalog.count-1);}
  });
  this.observer=new ResizeObserver(()=>{clearTimeout(this.resizeTimer);this.resizeTimer=setTimeout(()=>this.resize(),120);});
  dialog.addEventListener('fullscreenchange',()=>this.resize());
 }
 async open(catalog,page=1){
  const version=++this.version;this.dispose();this.catalog=catalog;this.index=Math.max(0,Math.min(catalog.count-1,Number(page)-1));this.zoomed=false;
  this.root.innerHTML=`<div class="book-head"><div><span class="eyebrow">Edición 2026</span><h2 id="readerTitle">${escape(catalog.title)}</h2></div><div class="book-actions"><a href="${encodeURI(catalog.pdf)}" target="_blank" rel="noopener" download>Descargar PDF ↓</a><button data-reader-action="zoom" aria-pressed="false">Ampliar ⊕</button><button data-reader-action="fullscreen" aria-label="Pantalla completa" title="Pantalla completa">⛶</button><button data-close aria-label="Cerrar lector">×</button></div></div><div class="reader-stage" id="bookStage" aria-busy="true"><div class="reader-floor" aria-hidden="true"></div><div id="readerBook" class="reader-book"></div></div><nav class="book-controls" aria-label="Navegación del catálogo"><button class="reader-edge" data-reader-action="first" aria-label="Primera página" title="Primera página">⇤</button><button data-reader-action="previous" aria-label="Página anterior">←</button><span id="readerPageLabel" class="fine" role="status" aria-live="polite"></span><label>Ir a página <input id="bookSlider" type="range" min="1" max="${catalog.count}" value="${this.index+1}"></label><button data-reader-action="next" aria-label="Página siguiente">→</button><button class="reader-edge" data-reader-action="last" aria-label="Última página" title="Última página">⇥</button></nav><p class="book-hint">Arrastra las esquinas para hojear. También puedes usar las flechas del teclado o deslizar.</p>`;
  this.dialog.setAttribute('aria-labelledby','readerTitle');
  if(!this.dialog.open)this.dialog.showModal();
  this.stage=this.root.querySelector('#bookStage');this.slider=this.root.querySelector('#bookSlider');
  this.slider.addEventListener('input',e=>this.go(Number(e.target.value)-1));
  const image=new Image();image.src=catalog.pages[0];
  try{await image.decode();this.ratio=image.naturalHeight/image.naturalWidth;}catch{this.ratio=Math.SQRT2;}
  if(version!==this.version||!this.dialog.open)return;
  this.mount();this.observer.observe(this.stage);
 }
 dimensions(){
  const width=this.stage.clientWidth,height=this.stage.clientHeight;
  const sides=width>=680?2:1;
  let pageWidth=Math.max(100,Math.min((width-30)/sides,(height-24)/this.ratio));
  if(this.zoomed)pageWidth*=1.65;
  return {pageWidth:Math.floor(pageWidth),pageHeight:Math.floor(pageWidth*this.ratio),sides};
 }
 mount(){
  const host=this.root.querySelector('#readerBook');
  if(this.engine)this.engine.destroy();
  // The engine removes its host on destruction; keep a fresh mount in the stage.
  const book=host?.isConnected?host:document.createElement('div');book.id='readerBook';book.className='reader-book';
  if(!book.isConnected)this.stage.append(book);
  const {pageWidth,pageHeight,sides}=this.dimensions();this.layout=`${pageWidth}:${pageHeight}:${sides}:${this.zoomed}`;this.sides=sides;
  book.replaceChildren(...this.catalog.pages.map((src,i)=>{
   const sheet=document.createElement('div');sheet.className='reader-sheet';sheet.dataset.pageIndex=i;
   const image=document.createElement('img');image.className='reader-page-image';image.src=src;image.alt=`${this.catalog.title}, página ${i+1}`;image.draggable=false;image.decoding='async';sheet.append(image);return sheet;
  }));
  // Fixed page dimensions fit the available height as well as width. Portrait
  // mode is controlled by stage width, so zoom never changes the page pairing.
  this.engine=new PageFlip(book,{
   width:pageWidth,height:pageHeight,size:'fixed',startPage:this.index,
   drawShadow:true,maxShadowOpacity:.45,flippingTime:reduced()?1:850,
   usePortrait:sides===1,showCover:false,autoSize:true,
   mobileScrollSupport:false,swipeDistance:35,showPageCorners:!reduced(),
   disableFlipByClick:false,useMouseEvents:!this.zoomed,
  });
  this.engine.on('flip',()=>this.sync());
  this.engine.on('init',()=>{if(this.dialog.open&&this.engine){this.sync();this.ready();}});
  this.engine.on('changeState',e=>this.stage.classList.toggle('is-turning',e.data!=='read'));
  this.stage.setAttribute('aria-busy','true');
  this.engine.loadFromHTML(book.querySelectorAll('.reader-sheet'));
  this.stage.classList.toggle('reader-zoomed',this.zoomed);this.sync();
 }
 async ready(){
  const engine=this.engine;
  const images=[...this.root.querySelectorAll('.reader-sheet[aria-hidden="false"] img')];
  await Promise.all(images.map(image=>image.decode().catch(()=>{})));
  if(this.dialog.open&&this.engine===engine)this.stage.setAttribute('aria-busy','false');
 }
 sync(){
  if(!this.engine)return;this.index=this.engine.getCurrentPageIndex();
  const end=Math.min(this.catalog.count,this.index+this.sides);
  this.slider.value=this.index+1;
  this.root.querySelector('#readerPageLabel').textContent=`${this.index+1}${end>this.index+1?'–'+end:''} / ${this.catalog.count}`;
  this.root.querySelectorAll('[data-reader-action="previous"],[data-reader-action="first"]').forEach(b=>b.disabled=this.index===0);
  this.root.querySelectorAll('[data-reader-action="next"],[data-reader-action="last"]').forEach(b=>b.disabled=end>=this.catalog.count);
  this.root.querySelectorAll('.reader-sheet').forEach(s=>s.setAttribute('aria-hidden',Number(s.dataset.pageIndex)<this.index||Number(s.dataset.pageIndex)>=end?'true':'false'));
 }
 turn(direction){
  if(!this.engine||this.engine.getState()!=='read')return;
  const end=this.index+this.sides;if(direction<0&&this.index===0||direction>0&&end>=this.catalog.count)return;
  if(reduced()){direction>0?this.engine.turnToNextPage():this.engine.turnToPrevPage();}
  else direction>0?this.engine.flipNext('bottom'):this.engine.flipPrev('bottom');
 }
 go(index){if(!this.engine)return;this.engine.turnToPage(Math.max(0,Math.min(this.catalog.count-1,index)));this.sync();}
 toggleZoom(){if(!this.engine)return;this.zoomed=!this.zoomed;const button=this.root.querySelector('[data-reader-action="zoom"]');button.textContent=this.zoomed?'Reducir ⊖':'Ampliar ⊕';button.setAttribute('aria-pressed',this.zoomed);this.mount();}
 resize(){if(!this.dialog.open||!this.engine)return;const d=this.dimensions();const layout=`${d.pageWidth}:${d.pageHeight}:${d.sides}:${this.zoomed}`;if(layout!==this.layout)this.mount();}
 async fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await this.dialog.requestFullscreen();}catch{/* Native fullscreen is optional; the fitted dialog stays available. */}}
 dispose(){this.observer.disconnect();clearTimeout(this.resizeTimer);if(this.engine){this.engine.destroy();this.engine=null;}this.stage?.classList.remove('is-turning');}
}
