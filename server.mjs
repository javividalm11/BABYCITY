import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { readFileSync, existsSync, mkdirSync, createReadStream, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const dbPath=process.env.DB_PATH || path.join(root,'data/babycity.sqlite');
mkdirSync(path.dirname(dbPath),{recursive:true});
export const db=new DatabaseSync(dbPath);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS admins(username TEXT PRIMARY KEY, salt TEXT NOT NULL, hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY, created TEXT NOT NULL, status TEXT NOT NULL, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS leads(id TEXT PRIMARY KEY, created TEXT NOT NULL, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS claims(id TEXT PRIMARY KEY, created TEXT NOT NULL, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS settings(id INTEGER PRIMARY KEY, data TEXT NOT NULL);`);
if(!db.prepare('SELECT count(*) n FROM products').get().n){
  const insert=db.prepare('INSERT INTO products VALUES (?,?)');
  for(const p of JSON.parse(readFileSync(path.join(root,'data/products.json'),'utf8'))) insert.run(p.id,JSON.stringify(p));
}
db.prepare('INSERT OR IGNORE INTO settings VALUES (1,?)').run(JSON.stringify({lima:null,province:null}));
const allProducts=()=>db.prepare('SELECT data FROM products ORDER BY id').all().map(r=>JSON.parse(r.data));
const settings=()=>JSON.parse(db.prepare('SELECT data FROM settings WHERE id=1').get().data);
const sha=s=>createHash('sha256').update(s).digest('hex');
const fail=(status,message)=>Object.assign(new Error(message),{status});
const text=(v,max=200)=>typeof v==='string'?v.trim().slice(0,max):'';
function customer(data){
  const name=text(data.name,120),phone=text(data.phone,20);
  if(name.length<2 || !/^\+?[0-9\s-]{9,18}$/.test(phone) || data.consent!==true) throw fail(400,'Completa nombre, celular y autorización de privacidad.');
  return {name,phone,consent:true,consentVersion:'2026-10-20',email:text(data.email,160),address:text(data.address,300)};
}
function validateProduct(p,id){
  if(!text(p.name,180)||!text(p.category,80)||!Number.isFinite(p.price)||p.price<0||p.price>100000||!(p.stock===null||(Number.isInteger(p.stock)&&p.stock>=0&&p.stock<=100000))) throw fail(400,'Revisa nombre, categoría, precio y stock.');
  const image=text(p.image,500);
  if(!/^\/assets\/[\w/.-]+\.(webp|png|jpg|jpeg)$/.test(image)) throw fail(400,'Selecciona una imagen de la biblioteca.');
  return {id,sku:text(p.sku,60)||`BC-${String(id).padStart(4,'0')}`,name:text(p.name,180),category:text(p.category,80),price:Math.round(p.price*100)/100,stock:p.stock,active:p.active!==false,image,description:text(p.description,3000),catalogId:text(p.catalogId,40),sourcePage:Number.isInteger(p.sourcePage)?p.sourcePage:null};
}
async function body(req){let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>2_000_000)throw fail(413,'Archivo demasiado grande.');chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString()||'{}');}catch{throw fail(400,'Solicitud inválida.');}}
const attempts=new Map();
function rate(req,key,max){const now=Date.now(),k=req.socket.remoteAddress+key;let r=attempts.get(k);if(!r||now>r.until){r={n:0,until:now+900000};attempts.set(k,r);}if(++r.n>max)throw fail(429,'Demasiados intentos. Vuelve a intentar en 15 minutos.');if(attempts.size>10000)for(const[k,v]of attempts)if(now>v.until)attempts.delete(k);}
function auth(req){const token=/\bbc_session=([a-f0-9]+)/.exec(req.headers.cookie||'')?.[1];if(!token)return false;return !!db.prepare('SELECT hash FROM sessions WHERE hash=? AND expires>?').get(sha(token),Date.now());}
function sameOrigin(req){if(req.headers['sec-fetch-site']==='cross-site')throw fail(403,'Origen no permitido.');if(req.headers.origin && req.headers.origin!==`http://${req.headers.host}` && req.headers.origin!==`https://${req.headers.host}`)throw fail(403,'Origen no permitido.');}
function send(res,status,data,headers={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});res.end(JSON.stringify(data));}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpeg':'image/jpeg','.jpg':'image/jpeg','.woff2':'font/woff2','.svg':'image/svg+xml','.pdf':'application/pdf','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8'};
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function htmlDocument(route){
 let html=readFileSync(path.join(root,'public/index.html'),'utf8');
 const origin=(process.env.SITE_URL||'').replace(/\/$/,'');
 const names={'/tienda':'Tienda','/catalogos':'Catálogos interactivos','/contacto':'Contacto y tienda física','/nosotros':'Nosotros','/legal/terminos':'Términos y condiciones','/legal/privacidad':'Política de privacidad','/legal/devoluciones':'Cambios y devoluciones','/reclamaciones':'Libro de Reclamaciones','/admin':'Administración','/favoritos':'Mis favoritos'};
 let schema={'@context':'https://schema.org','@type':'Store',name:'BabyCity',legalName:'GRUPO BABY STORE S.A.C.',taxID:'20614491036',telephone:'+51937473120',address:{'@type':'PostalAddress',streetAddress:'Jr. Antonio Raymondi 512',addressLocality:'La Victoria',addressRegion:'Lima',addressCountry:'PE'},sameAs:['https://www.tiktok.com/@babycityperu','https://www.falabella.com.pe/falabella-pe/seller/BABY%20STORE'],...(origin?{url:origin}:{} )};
 const id=/^\/producto\/(\d+)$/.exec(route)?.[1];const p=id&&allProducts().find(p=>p.id===Number(id)&&p.active);
 const title=p?p.name:names[route];
 if(title)html=html.replace(/<title>.*?<\/title>/,`<title>${escapeHtml(title)} · BabyCity Perú</title>`);
 if(p){schema={'@context':'https://schema.org','@type':'Product',name:p.name,sku:p.sku,description:p.description,...(origin?{image:origin+p.image}:{}),offers:{'@type':'Offer',price:p.price,priceCurrency:'PEN',...(origin?{url:origin+route}:{}),...(p.stock!==null?{availability:'https://schema.org/'+(p.stock>0?'InStock':'OutOfStock')}:{})}};
 html=html.replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${escapeHtml(p.name+' en BabyCity Perú. '+p.description.slice(0,140))}">`);
 html=html.replace('<div class="loading">Preparando un mundo de pequeños descubrimientos…</div>',`<article class="container section"><h1>${escapeHtml(p.name)}</h1><img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" width="300"><p>${escapeHtml(p.description)}</p><p>S/ ${p.price.toFixed(2)} · ${p.stock===null?'Disponibilidad por confirmar':p.stock===0?'Agotado':'Disponible'}</p><a href="https://wa.me/51937473120">Consultar por WhatsApp</a></article>`);
 }
 const extra=`<script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>${origin?`<link rel="canonical" href="${escapeHtml(origin+route)}"><meta property="og:url" content="${escapeHtml(origin+route)}">`:''}<meta property="og:title" content="${escapeHtml((title||'El mundo de tu bebé, a un clic')+' · BabyCity Perú')}"><meta property="og:type" content="website">${['/admin','/favoritos'].includes(route)?'<meta name="robots" content="noindex,nofollow">':''}`;
 return html.replace('</head>',extra+'</head>');
}
export const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','SAMEORIGIN');
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; frame-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'");
 try{
  const url=new URL(req.url,'http://localhost'),route=url.pathname,method=req.method;
  if(['POST','PUT','PATCH','DELETE'].includes(method))sameOrigin(req);
  if(route.startsWith('/api/admin/') && route!='/api/admin/login' && !auth(req))throw fail(401,'Inicia sesión para continuar.');
  if(route==='/api/products'&&method==='GET')return send(res,200,allProducts().filter(p=>p.active));
  if(route==='/api/settings'&&method==='GET')return send(res,200,settings());
  if(route==='/api/admin/login'&&method==='POST'){
    rate(req,'login',10);const b=await body(req);const a=db.prepare('SELECT * FROM admins WHERE username=?').get(text(b.username,100));
    const actual=scryptSync(String(b.password||'').slice(0,1000),a?.salt||'dummy',64);
    if(!a||!timingSafeEqual(actual,Buffer.from(a.hash,'hex')))throw fail(401,'Usuario o contraseña incorrectos.');
    const token=randomBytes(32).toString('hex');db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());db.prepare('INSERT INTO sessions VALUES (?,?)').run(sha(token),Date.now()+28800000);
    return send(res,200,{ok:true},{'Set-Cookie':`bc_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.COOKIE_SECURE==='true'?'; Secure':''}`});
  }
  if(route==='/api/admin/logout'&&method==='POST'){const t=/\bbc_session=([a-f0-9]+)/.exec(req.headers.cookie||'')?.[1];if(t)db.prepare('DELETE FROM sessions WHERE hash=?').run(sha(t));return send(res,200,{ok:true},{'Set-Cookie':'bc_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});}
  if(route==='/api/admin/dashboard'&&method==='GET')return send(res,200,{products:allProducts(),settings:settings(),orders:db.prepare('SELECT * FROM orders ORDER BY created DESC').all().map(r=>({...r,data:JSON.parse(r.data)})),leads:db.prepare('SELECT * FROM leads ORDER BY created DESC').all().map(r=>({...r,data:JSON.parse(r.data)})),claims:db.prepare('SELECT * FROM claims ORDER BY created DESC').all().map(r=>({...r,data:JSON.parse(r.data)}))});
  if(route==='/api/admin/images'&&method==='POST'){
    const b=await body(req);if(typeof b.base64!=='string'||b.base64.length>1_500_000)throw fail(400,'Imagen demasiado grande (máximo 1 MB).');
    const bytes=Buffer.from(b.base64,'base64');const ext=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'png':bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'jpg':bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP'?'webp':null;
    if(!ext||bytes.length>1_048_576)throw fail(400,'Usa una imagen PNG, JPG o WebP de hasta 1 MB.');
    const dir=path.join(root,'public/assets/uploads');mkdirSync(dir,{recursive:true});const file=randomBytes(16).toString('hex')+'.'+ext;writeFileSync(path.join(dir,file),bytes);return send(res,201,{image:'/assets/uploads/'+file});
  }
  if(route==='/api/admin/products'&&['PUT','POST'].includes(method)){
    const b=await body(req);const id=method==='POST'?(db.prepare('SELECT coalesce(max(id),0)+1 id FROM products').get().id):Number(b.id);
    if(method==='PUT'&&!db.prepare('SELECT id FROM products WHERE id=?').get(id))throw fail(404,'Producto no encontrado.');
    const p=validateProduct(b,id);db.prepare('INSERT OR REPLACE INTO products VALUES (?,?)').run(id,JSON.stringify(p));return send(res,200,p);
  }
  if(route==='/api/admin/settings'&&method==='PUT'){const b=await body(req);for(const k of ['lima','province'])if(b[k]!==null&&(!Number.isFinite(b[k])||b[k]<0||b[k]>10000))throw fail(400,'Tarifa inválida.');db.prepare('UPDATE settings SET data=? WHERE id=1').run(JSON.stringify({lima:b.lima,province:b.province}));return send(res,200,{ok:true});}
  if(route==='/api/admin/orders'&&method==='PATCH'){const b=await body(req);if(!['solicitud','contactado','confirmado','enviado','completado','cancelado'].includes(b.status))throw fail(400,'Estado inválido.');if(!db.prepare('UPDATE orders SET status=? WHERE id=?').run(b.status,text(b.id,50)).changes)throw fail(404,'Pedido no encontrado.');return send(res,200,{ok:true});}
  if(route==='/api/orders'&&method==='POST'){
    rate(req,'order',30);const b=await body(req);const c=customer(b);if(!['pickup','lima','province'].includes(b.delivery))throw fail(400,'Selecciona la entrega.');if(b.delivery!=='pickup'&&!c.address)throw fail(400,'Indica la dirección y ciudad de entrega.');
    if(!Array.isArray(b.items)||!b.items.length||b.items.length>50)throw fail(400,'Tu carrito está vacío o supera 50 productos.');
    const seen=new Set();const items=b.items.map(i=>{if(seen.has(i.id))throw fail(400,'Producto duplicado.');seen.add(i.id);const row=db.prepare('SELECT data FROM products WHERE id=?').get(Number(i.id));const p=row&&JSON.parse(row.data);if(!p||!p.active||!Number.isInteger(i.quantity)||i.quantity<1||i.quantity>99||(p.stock!==null&&p.stock<i.quantity))throw fail(409,'La disponibilidad cambió. Actualiza tu carrito.');return {id:p.id,name:p.name,price:p.price,quantity:i.quantity,stockConfirmed:p.stock!==null};});
    const subtotal=Math.round(items.reduce((s,i)=>s+i.price*i.quantity,0)*100)/100,shipping=b.delivery==='pickup'?0:settings()[b.delivery],total=shipping===null?null:Math.round((subtotal+shipping)*100)/100;
    const id='BC-'+randomBytes(5).toString('hex').toUpperCase();const order={customer:c,items,subtotal,shipping,total,delivery:b.delivery,notes:text(b.notes,700)};
    db.prepare('INSERT INTO orders VALUES (?,?,?,?)').run(id,new Date().toISOString(),'solicitud',JSON.stringify(order));
    // A quotation does not reserve or decrement stock; admin confirms availability.
    return send(res,201,{id,...order});
  }
  if(route==='/api/leads'&&method==='POST'){rate(req,'lead',20);const b=await body(req);const c=customer(b);const message=text(b.message,1000);if(!message)throw fail(400,'Escribe tu consulta.');db.prepare('INSERT INTO leads VALUES (?,?,?)').run(randomBytes(12).toString('hex'),new Date().toISOString(),JSON.stringify({...c,message}));return send(res,201,{ok:true});}
  if(route==='/api/claims'&&method==='POST'){rate(req,'claim',15);const b=await body(req),c=customer(b);if(!text(b.detail,3000)||!text(b.request,2000)||!['reclamo','queja'].includes(b.type)||!text(b.document,30)||!c.email||!c.address)throw fail(400,'Completa todos los datos de tu reclamación.');const id='REC-'+randomBytes(6).toString('hex').toUpperCase();db.prepare('INSERT INTO claims VALUES (?,?,?)').run(id,new Date().toISOString(),JSON.stringify({...c,type:b.type,document:text(b.document,30),detail:text(b.detail,3000),request:text(b.request,2000),product:text(b.product,200)}));return send(res,201,{id});}
  if(route.startsWith('/api/'))throw fail(404,'Ruta no encontrada.');
  if(method!=='GET'&&method!=='HEAD')throw fail(405,'Método no permitido.');
  if(route==='/sitemap.xml'){const origin=process.env.SITE_URL;if(!origin)throw fail(503,'Configura SITE_URL para generar el sitemap del dominio definitivo.');res.writeHead(200,{'Content-Type':mime['.xml']});return res.end('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+['/','/tienda','/catalogos','/nosotros','/contacto','/legal/terminos','/legal/privacidad','/legal/devoluciones',...allProducts().filter(p=>p.active).map(p=>'/producto/'+p.id)].map(p=>'<url><loc>'+origin.replace(/\/$/,'').replace(/&/g,'&amp;')+p+'</loc></url>').join('')+'</urlset>');}
  let base=path.join(root,'public'),rel=decodeURIComponent(route);
  if(route.startsWith('/catalogo/')){base=path.join(root,'catalogo');rel=rel.slice('/catalogo'.length);}
  let file=path.resolve(base,'.'+rel);
  if(!file.startsWith(base+path.sep)&&file!==base)throw fail(403,'Acceso denegado.');
  if(!existsSync(file)||statSync(file).isDirectory()){
    if(/^\/(?:tienda|catalogos|nosotros|contacto|favoritos|admin|reclamaciones|producto\/\d+|legal\/(?:terminos|privacidad|devoluciones))?\/?$/.test(route))file=path.join(root,'public/index.html');else throw fail(404,'Archivo no encontrado.');
  }
  const ext=path.extname(file).toLowerCase();
  if(ext==='.html'){const html=htmlDocument(route);res.writeHead(200,{'Content-Type':mime[ext],'Cache-Control':'no-cache','Content-Length':Buffer.byteLength(html)});return res.end(method==='HEAD'?undefined:html);}
  res.writeHead(200,{'Content-Type':mime[ext]||'application/octet-stream','Cache-Control':'public, max-age=3600','Content-Length':statSync(file).size});if(method==='HEAD')res.end();else createReadStream(file).pipe(res);
 }catch(e){if(!e.status)console.error(e);send(res,e.status||500,{error:e.status?e.message:'No pudimos procesar la solicitud.'});}
});
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))server.listen(Number(process.env.PORT)||3000,process.env.HOST||'127.0.0.1',()=>console.log(`BabyCity: http://${process.env.HOST||'127.0.0.1'}:${process.env.PORT||3000}`));
