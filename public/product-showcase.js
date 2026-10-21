const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const price=value=>new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN',minimumFractionDigits:2}).format(value);
const paths={grid:'M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z',stroller:'M5 3h7a7 7 0 0 1 7 7H5V3Zm0 7 3 8h10l3-8M2 3h3M9 21h.01M18 21h.01',crib:'M3 8h18v12M3 4v16M3 16h18M8 8v8m4-8v8m4-8v8M5 4h3m8 0h3',rocker:'M8 3h8l2 13H6L8 3Zm-3 18c4 2 10 2 14 0M8 16l-2 5m10-5 2 5',chair:'M7 3h10v7H7V3Zm-3 8h16M7 11v5h10v-5M8 16l-2 6m10-6 2 6',bath:'M2 10h20l-3 9H5L2 10Zm3 9v3m14-3v3M6 10V4a2 2 0 0 1 4 0',bag:'M5 8h14l2 13H3L5 8Zm3 0V5a4 4 0 0 1 8 0v3',heart:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',cart:'M2 3h3l3 13h11l3-10H6M10 21h.01M18 21h.01',arrow:'M4 12h16m-6-6 6 6-6 6',back:'M20 12H4m6-6-6 6 6 6'};
const icon=name=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name]}"/></svg>`;
const filters=[{id:'all',label:'Todos',icon:'grid'},{id:'strollers',label:'Coches',icon:'stroller',categories:['Coches','Coches 2 y 3 en 1','Melliceros']},{id:'cribs',label:'Cunas y colechos',icon:'crib',categories:['Cunas y colechos','Cercos de juego']},{id:'rockers',label:'Mecedoras',icon:'rocker',categories:['Mecedoras']},{id:'chairs',label:'Sillas de comer',icon:'chair',categories:['Sillas de comer']},{id:'bath',label:'Baño y cuidado',icon:'bath',categories:['Baño y cuidado']},{id:'accessories',label:'Accesorios',icon:'bag',categories:['Accesorios']}];
const featured=[2,29,36,30,4,24,31,42,6,28,37,15,7,32,17,44];
const descriptions={'Coches':'Comodidad para sus primeros paseos.','Coches 2 y 3 en 1':'Para acompañar sus aventuras.','Melliceros':'Paseos y momentos para compartir.','Cunas y colechos':'Un espacio para sus dulces sueños.','Cercos de juego':'Un espacio para descubrir y jugar.','Mecedoras':'Pequeños momentos de calma.','Sillas de comer':'Para sus nuevas grandes aventuras.','Baño y cuidado':'Burbujas y momentos para compartir.','Accesorios':'Pequeños detalles para su día a día.'};

export function renderProductShowcase(){return `<section class="product-showcase" id="seleccion-babycity" aria-labelledby="showcaseTitle"><div class="container"><div class="showcase-heading"><div><span class="eyebrow">Para cada pequeño gran momento</span><h2 id="showcaseTitle">Un mundo <em>por descubrir</em></h2><p>Productos de calidad para acompañar cada etapa de su crecimiento.</p></div><a href="/tienda" data-link class="text-link">Ver todos los productos ${icon('arrow')}</a></div><div class="showcase-filters" role="group" aria-label="Filtrar la selección de productos">${filters.map((f,i)=>`<button type="button" data-showcase-filter="${f.id}" aria-pressed="${i===0}" class="${i===0?'active':''}">${icon(f.icon)}${f.label}</button>`).join('')}</div><div class="showcase-carousel"><button type="button" class="showcase-arrow showcase-prev" data-showcase-step="-1" aria-label="Ver productos anteriores">${icon('back')}</button><div class="showcase-viewport" tabindex="0" aria-label="Carrusel de productos"><div class="showcase-grid"></div></div><button type="button" class="showcase-arrow showcase-next" data-showcase-step="1" aria-label="Ver productos siguientes">${icon('arrow')}</button></div><div class="showcase-dots" role="group" aria-label="Grupos de productos"></div><p class="showcase-status sr-only" role="status" aria-live="polite"></p></div></section>`;}

function card(p,favorites){const saved=favorites.includes(p.id),confirmed=Number.isInteger(p.stock)&&p.stock>0;return `<article class="showcase-card" data-showcase-product="${p.id}"><div class="showcase-photo"><a href="/producto/${p.id}" data-link aria-label="Ver ${escape(p.name)}"><img src="${escape(p.image)}" alt="${escape(p.name)}" loading="lazy" decoding="async" width="320" height="240"></a><span class="showcase-stock ${confirmed?'confirmed':''}">${confirmed?'En stock':'Consultar stock'}</span><button type="button" class="wish ${saved?'saved':''}" data-wish="${p.id}" aria-label="${saved?'Quitar de':'Guardar en'} favoritos" aria-pressed="${saved}">${icon('heart')}</button></div><div class="showcase-info"><span class="showcase-category">${escape(p.category)}</span><a class="showcase-name" href="/producto/${p.id}" data-link title="${escape(p.name)}"><h3>${escape(p.name)}</h3></a><p>${escape(descriptions[p.category]||'Descubre su próximo favorito.')}</p><strong class="showcase-price">${price(p.price)}</strong><button type="button" class="showcase-add" data-add="${p.id}" aria-label="Agregar ${escape(p.name)} al carrito">${icon('cart')}Agregar al carrito</button></div></article>`;}

let cleanup=()=>{};
export function destroyProductShowcase(){cleanup();cleanup=()=>{};}
export function mountProductShowcase(root,products,getFavorites){
 destroyProductShowcase();const section=root?.querySelector('.product-showcase');if(!section)return;
 let filter='all',page=0,count=window.innerWidth>=1080?4:window.innerWidth>=680?2:1,touch=null,timer=null,inView=false,hovered=false,disposed=false,autoplay=!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const grid=section.querySelector('.showcase-grid'),viewport=section.querySelector('.showcase-viewport');
 function schedule(){
  clearTimeout(timer);timer=null;if(disposed)return;
  const pages=Math.ceil(items().length/count);
  section.querySelector('.showcase-status').setAttribute('aria-live',autoplay?'off':'polite');
  if(!autoplay||!inView||hovered||touch||document.hidden||section.contains(document.activeElement)||document.querySelector('dialog[open]')||pages<=1)return;
  timer=setTimeout(()=>{if(document.querySelector('dialog[open]')){schedule();return;}page=(page+1)%pages;draw();},5000);
 }
 const items=()=>{
  const group=filters.find(f=>f.id===filter);
  const list=products.filter(p=>p.active!==false&&p.stock!==0&&(filter==='all'||group.categories.includes(p.category)));
  list.sort((a,b)=>Number(b.stock>0)-Number(a.stock>0)||((featured.indexOf(a.id)+1||999)-(featured.indexOf(b.id)+1||999))||a.id-b.id);
  return filter==='all'?list.slice(0,16):list;
 };
 function draw(){
  const list=items(),pages=Math.ceil(list.length/count);page=Math.max(0,Math.min(page,pages-1));
  grid.innerHTML=list.length?list.slice(page*count,(page+1)*count).map(p=>card(p,getFavorites())).join(''):'<div class="showcase-empty">Pronto tendremos más productos para esta categoría. <a href="/tienda" data-link>Explora la tienda</a>.</div>';
  section.querySelector('.showcase-prev').disabled=page===0;
  section.querySelector('.showcase-next').disabled=!pages||page===pages-1;
  section.querySelector('.showcase-dots').innerHTML=pages>1?Array.from({length:pages},(_,i)=>`<button type="button" data-showcase-page="${i}" aria-label="Ver grupo de productos ${i+1}" ${page===i?'aria-current="page"':''}></button>`).join(''):'';
  section.querySelector('.showcase-status').textContent=list.length?`Productos ${page*count+1} a ${Math.min((page+1)*count,list.length)} de ${list.length}.`:'No hay productos para esta categoría.';
  section.querySelectorAll('[data-showcase-filter]').forEach(b=>{const active=b.dataset.showcaseFilter===filter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  schedule();
 }
 function changePage(next){const pages=Math.ceil(items().length/count);if(next<0||next>=pages)return;page=next;draw();}
 function click(event){const button=event.target.closest('button');if(!button)return;if(button.dataset.showcaseFilter){filter=button.dataset.showcaseFilter;page=0;draw();}else if(button.dataset.showcaseStep)changePage(page+Number(button.dataset.showcaseStep));else if(button.hasAttribute('data-showcase-page'))changePage(Number(button.dataset.showcasePage));}
 function keys(event){if(event.target!==viewport)return;if(event.key==='ArrowRight'){event.preventDefault();changePage(page+1);}if(event.key==='ArrowLeft'){event.preventDefault();changePage(page-1);}}
 function start(event){touch={x:event.changedTouches[0].clientX,y:event.changedTouches[0].clientY};schedule();}
 function end(event){if(!touch)return;const dx=event.changedTouches[0].clientX-touch.x,dy=event.changedTouches[0].clientY-touch.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3)changePage(page+(dx<0?1:-1));touch=null;schedule();}
 function enter(event){if(event.pointerType==='mouse'){hovered=true;schedule();}}
 function leave(){hovered=false;schedule();}
 function focusChanged(){queueMicrotask(schedule);}
 function cancelTouch(){touch=null;schedule();}
 section.addEventListener('click',click);viewport.addEventListener('keydown',keys);viewport.addEventListener('touchstart',start,{passive:true});viewport.addEventListener('touchend',end,{passive:true});
 section.addEventListener('pointerenter',enter);section.addEventListener('pointerleave',leave);section.addEventListener('focusin',focusChanged);section.addEventListener('focusout',focusChanged);document.addEventListener('visibilitychange',schedule);document.addEventListener('close',schedule,true);viewport.addEventListener('touchcancel',cancelTouch);
 const visibility=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;schedule();});visibility.observe(section);
 const observer=new ResizeObserver(()=>{const next=window.innerWidth>=1080?4:window.innerWidth>=680?2:1;if(next===count)return;const first=page*count;count=next;page=Math.floor(first/count);draw();});observer.observe(section);
 cleanup=()=>{disposed=true;clearTimeout(timer);observer.disconnect();visibility.disconnect();section.removeEventListener('click',click);viewport.removeEventListener('keydown',keys);viewport.removeEventListener('touchstart',start);viewport.removeEventListener('touchend',end);viewport.removeEventListener('touchcancel',cancelTouch);section.removeEventListener('pointerenter',enter);section.removeEventListener('pointerleave',leave);section.removeEventListener('focusin',focusChanged);section.removeEventListener('focusout',focusChanged);document.removeEventListener('visibilitychange',schedule);document.removeEventListener('close',schedule,true);};
 draw();
}
