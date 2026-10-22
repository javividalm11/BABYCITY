import { api } from '../lib/api.js';
import { esc, money } from '../lib/format.js';
import { notify } from '../lib/notify.js';
let dashboard,
  tab = 'products',
  main,
  query = '',
  editor;
const statusLabels = {
  solicitud: 'Solicitud recibida',
  contactado: 'Cliente contactado',
  confirmado: 'Pedido confirmado',
  enviado: 'Enviado',
  completado: 'Completado',
  cancelado: 'Cancelado',
};
export async function renderAdmin(target) {
  main = target;
  try {
    dashboard = await api('/api/admin/dashboard');
    draw();
  } catch {
    login();
  }
}
function login() {
  main.innerHTML = `<section class="admin-section"><div class="admin-login"><span class="eyebrow">BabyCity · Administración</span><h1>Hola de nuevo.</h1><p>Ingresa para cuidar cada detalle de tu tienda.</p><form id="adminLogin"><label>Usuario<input name="username" required autocomplete="username"></label><label>Contraseña<input name="password" type="password" required autocomplete="current-password"></label><button class="btn primary">Ingresar →</button><p class="form-status" role="status"></p></form><p class="fine">Si aún no tienes acceso, solicita al responsable técnico que configure tu cuenta.</p></div></section>`;
  document.querySelector('#adminLogin').onsubmit = async (e) => {
    e.preventDefault();
    const f = e.currentTarget,
      b = f.querySelector('button');
    b.disabled = true;
    try {
      await api('/api/admin/login', 'POST', Object.fromEntries(new FormData(f)));
      dashboard = await api('/api/admin/dashboard');
      draw();
    } catch (err) {
      f.querySelector('.form-status').textContent = err.message;
    } finally {
      b.disabled = false;
    }
  };
}
function draw() {
  main.innerHTML = `<section class="admin-section"><div class="admin-top"><div><span class="eyebrow">Tu tienda, en tus manos</span><h1>Hola, BabyCity.</h1></div><button class="btn secondary" id="logout">Cerrar sesión ↗</button></div><div class="stats"><div class="stat"><strong>${dashboard.products.filter((p) => p.active).length}</strong><small>Productos publicados</small></div><div class="stat"><strong>${dashboard.products.filter((p) => p.stock === null).length}</strong><small>Existencias por confirmar</small></div><div class="stat"><strong>${dashboard.orders.filter((o) => !['completado', 'cancelado'].includes(o.status)).length}</strong><small>Solicitudes abiertas</small></div><div class="stat"><strong>${dashboard.leads.length}</strong><small>Consultas recibidas</small></div></div><nav class="admin-tabs" aria-label="Administración">${[
    ['products', 'Productos'],
    ['orders', 'Pedidos'],
    ['leads', 'Consultas'],
    ['claims', 'Reclamaciones'],
    ['settings', 'Envíos y respaldo'],
  ]
    .map(
      ([id, t]) =>
        `<button data-tab="${id}" class="${tab === id ? 'active' : ''}" aria-pressed="${tab === id}">${t}</button>`,
    )
    .join('')}</nav><div id="adminPanel"></div></section>`;
  main.querySelector('#logout').onclick = async () => {
    await api('/api/admin/logout', 'POST', {});
    dashboard = null;
    login();
  };
  main.querySelectorAll('[data-tab]').forEach(
    (b) =>
      (b.onclick = () => {
        tab = b.dataset.tab;
        query = '';
        draw();
      }),
  );
  drawPanel();
}
function drawPanel() {
  const panel = main.querySelector('#adminPanel');
  if (tab === 'products') {
    panel.innerHTML = `<div class="admin-tools"><input id="adminSearch" type="search" placeholder="Buscar producto o código…" aria-label="Buscar productos" value="${esc(query)}"><button id="newProduct" class="btn primary">+ Agregar producto</button></div><div class="table-wrap"><table><thead><tr><th>Imagen</th><th>Producto</th><th>Precio</th><th>Existencias</th><th>Estado</th><th>Acciones</th></tr></thead><tbody id="adminRows"></tbody></table></div><p class="fine">«Por confirmar» indica que el catálogo no especifica cantidades. Stock 0 muestra «Agotado». Las solicitudes no reservan existencias: actualízalas al confirmar cada venta.</p>`;
    rows();
    panel.querySelector('#adminSearch').oninput = (e) => {
      query = e.target.value;
      rows();
    };
    panel.querySelector('#newProduct').onclick = () => edit();
  } else if (tab === 'orders') {
    panel.innerHTML = dashboard.orders.length
      ? dashboard.orders
          .map(
            (o) =>
              `<article class="admin-record"><div class="admin-top"><h3>${esc(o.id)}</h3><span class="badge">${esc(new Date(o.created).toLocaleString('es-PE'))}</span></div><p><b>${esc(o.data.customer.name)}</b> · ${esc(o.data.customer.phone)}<br>${esc(o.data.customer.email)}<br>Entrega: ${esc(o.data.delivery)} · ${esc(o.data.customer.address || 'Recojo en tienda')}</p><p>${o.data.items.map((i) => `${i.quantity} × ${esc(i.name)} — ${money(i.price * i.quantity)}`).join('<br>')}</p><p>Subtotal: ${money(o.data.subtotal)} · Envío: ${o.data.shipping === null ? 'Por cotizar' : money(o.data.shipping)} · ${o.data.total === null ? 'Total por confirmar' : 'Total: ' + money(o.data.total)}</p><p>${esc(o.data.notes)}</p><label>Estado<select data-order="${esc(o.id)}">${Object.entries(
                statusLabels,
              )
                .map(
                  ([v, t]) =>
                    `<option value="${v}" ${o.status === v ? 'selected' : ''}>${t}</option>`,
                )
                .join(
                  '',
                )}</select></label><p class="fine">Confirmar o completar una solicitud no descuenta inventario automáticamente. Actualiza el stock del producto al cerrar la venta.</p></article>`,
          )
          .join('')
      : '<div class="empty">Los pedidos aparecerán aquí cuando tus clientes registren una solicitud.</div>';
    panel.querySelectorAll('[data-order]').forEach(
      (s) =>
        (s.onchange = async () => {
          try {
            await api('/api/admin/orders', 'PATCH', { id: s.dataset.order, status: s.value });
            dashboard.orders.find((o) => o.id === s.dataset.order).status = s.value;
            notify('Estado actualizado');
          } catch (e) {
            notify(e.message);
          }
        }),
    );
  } else if (tab === 'leads')
    panel.innerHTML = dashboard.leads.length
      ? dashboard.leads
          .map(
            (l) =>
              `<article class="admin-record"><h3>${esc(l.data.name)}</h3><p>${esc(l.data.phone)} · ${esc(new Date(l.created).toLocaleString('es-PE'))}</p><p>${esc(l.data.message)}</p><a href="https://wa.me/${l.data.phone.replace(/\D/g, '')}" target="_blank" rel="noopener" class="text-link">Responder en WhatsApp ↗</a></article>`,
          )
          .join('')
      : '<div class="empty">Todavía no hay consultas.</div>';
  else if (tab === 'claims')
    panel.innerHTML = dashboard.claims.length
      ? dashboard.claims
          .map(
            (c) =>
              `<article class="admin-record"><span class="badge">${esc(c.id)} · ${esc(c.data.type)}</span><h3>${esc(c.data.name)}</h3><p>Fecha: ${esc(new Date(c.created).toLocaleString('es-PE'))}<br>Documento: ${esc(c.data.document)}<br>Correo: ${esc(c.data.email)} · Celular: ${esc(c.data.phone)}<br>Domicilio: ${esc(c.data.address)}</p><p><b>Producto o servicio:</b> ${esc(c.data.product)}</p><p><b>Detalle:</b> ${esc(c.data.detail)}</p><p><b>Solicitud:</b> ${esc(c.data.request)}</p><p class="fine">Gestiona la respuesta al correo del cliente dentro del plazo legal. Este panel no envía respuestas automáticas.</p></article>`,
          )
          .join('')
      : '<div class="empty">No hay reclamaciones registradas.</div>';
  else {
    panel.innerHTML = `<div class="info-grid"><section class="info-card"><h2>Tarifas de envío</h2><p>Deja el campo vacío para mostrar «Por cotizar». El recojo en tienda siempre es gratuito. Publica una tarifa solo si aplica al ámbito completo de esa opción.</p><form id="shippingForm"><label>Envío a Lima (S/)<input name="lima" type="number" step="0.01" min="0" max="10000" value="${esc(dashboard.settings.lima ?? '')}"></label><label>Envío a provincias (S/)<input name="province" type="number" step="0.01" min="0" max="10000" value="${esc(dashboard.settings.province ?? '')}"></label><button class="btn primary">Guardar tarifas</button><p class="form-status" role="status"></p></form></section><section class="info-card"><h2>Respaldo de tus datos</h2><p>Descarga productos, pedidos, consultas y reclamaciones. El archivo contiene datos personales: guárdalo en un lugar seguro y compártelo únicamente con personal autorizado.</p><button class="btn secondary" id="exportData">Descargar respaldo JSON ↓</button><p class="fine">El respaldo completo de base de datos se realiza en el servidor con npm run backup. Las imágenes y PDF se respaldan por separado.</p></section></div>`;
    panel.querySelector('#shippingForm').onsubmit = async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const v = Object.fromEntries(new FormData(form));
      for (const k in v) v[k] = v[k] === '' ? null : Number(v[k]);
      try {
        await api('/api/admin/settings', 'PUT', v);
        dashboard.settings = v;
        notify('Tarifas guardadas');
      } catch (err) {
        form.querySelector('.form-status').textContent = err.message;
      }
    };
    panel.querySelector('#exportData').onclick = () => {
      const blob = new Blob(
        [JSON.stringify({ ...dashboard, exported: new Date().toISOString() }, null, 2)],
        { type: 'application/json' },
      );
      const u = URL.createObjectURL(blob),
        a = document.createElement('a');
      a.href = u;
      a.download = 'babycity-respaldo-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(u), 1000);
    };
  }
}
function rows() {
  const list = dashboard.products.filter((p) =>
    (p.name + ' ' + p.sku).toLowerCase().includes(query.toLowerCase()),
  );
  main.querySelector('#adminRows').innerHTML = list
    .map(
      (p) =>
        `<tr><td><img src="${esc(p.image)}" alt=""></td><td>${esc(p.name)}<small>${esc(p.sku)} · ${esc(p.category)}</small></td><td>${money(p.price)}</td><td>${p.stock === null ? 'Por confirmar' : p.stock}</td><td>${p.active ? 'Publicado' : 'Oculto'}</td><td><button data-edit="${p.id}">Editar</button></td></tr>`,
    )
    .join('');
  main
    .querySelectorAll('[data-edit]')
    .forEach(
      (b) =>
        (b.onclick = () => edit(dashboard.products.find((p) => p.id === Number(b.dataset.edit)))),
    );
}
function edit(existing) {
  const p = existing || {
    name: '',
    sku: '',
    category: 'Accesorios',
    price: 0,
    stock: null,
    active: true,
    description: '',
    image: dashboard.products[0].image,
  };
  editor?.remove();
  editor = document.createElement('dialog');
  editor.className = 'admin-editor';
  editor.innerHTML = `<button class="close" data-close aria-label="Cerrar">×</button><span class="eyebrow">Cuida cada detalle</span><h2>${existing ? 'Editar producto' : 'Nuevo producto'}</h2><form id="productEdit"><div class="form-grid"><label class="span-2">Nombre<input name="name" required maxlength="180" value="${esc(p.name)}"></label><label>Código<input name="sku" maxlength="60" value="${esc(p.sku)}"></label><label>Categoría<input name="category" required list="categoryNames" maxlength="80" value="${esc(p.category)}"><datalist id="categoryNames">${[...new Set(dashboard.products.map((p) => p.category))].map((c) => `<option value="${esc(c)}">`).join('')}</datalist></label><label>Precio (S/)<input name="price" type="number" min="0" max="100000" step="0.01" required value="${esc(p.price)}"></label><label>Stock (vacío = por confirmar)<input name="stock" type="number" min="0" max="100000" step="1" value="${esc(p.stock ?? '')}"></label><label class="span-2">Descripción<textarea name="description" maxlength="3000" rows="4">${esc(p.description)}</textarea></label><label class="span-2">Imagen actual<img class="preview-upload" id="selectedImage" src="${esc(p.image)}" alt="Imagen seleccionada"><input type="hidden" name="image" value="${esc(p.image)}"></label><label class="span-2">Subir imagen (PNG, JPG, WebP · hasta 1 MB)<input id="imageUpload" type="file" accept="image/png,image/jpeg,image/webp"></label><div class="span-2"><p class="fine">O elige una imagen de la biblioteca:</p><div class="image-library">${[...new Set(dashboard.products.map((p) => p.image))].map((src) => `<button type="button" data-image="${esc(src)}" class="${p.image === src ? 'selected' : ''}" aria-label="Usar esta imagen"><img src="${esc(src)}" alt="Imagen de producto" loading="lazy"></button>`).join('')}</div></div><label class="check span-2"><input name="active" type="checkbox" ${p.active ? 'checked' : ''}>Publicar en la tienda (desactiva para ocultarlo)</label></div><button class="btn primary">Guardar producto →</button><p class="form-status" role="status"></p></form>`;
  document.body.append(editor);
  editor.showModal();
  const f = editor.querySelector('form'),
    status = f.querySelector('.form-status');
  const choose = (src) => {
    f.elements.image.value = src;
    editor.querySelector('#selectedImage').src = src;
    editor
      .querySelectorAll('[data-image]')
      .forEach((b) => b.classList.toggle('selected', b.dataset.image === src));
  };
  editor
    .querySelectorAll('[data-image]')
    .forEach((b) => (b.onclick = () => choose(b.dataset.image)));
  editor.querySelector('#imageUpload').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1048576) {
      status.textContent = 'La imagen debe pesar como máximo 1 MB.';
      return;
    }
    try {
      status.textContent = 'Subiendo imagen…';
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const r = await api('/api/admin/images', 'POST', { base64 });
      choose(r.image);
      status.textContent = 'Imagen lista.';
    } catch (err) {
      status.textContent = err.message;
    }
  };
  f.onsubmit = async (e) => {
    e.preventDefault();
    const b = f.querySelector('button:not([type=button])');
    b.disabled = true;
    const v = Object.fromEntries(new FormData(f));
    v.price = Number(v.price);
    v.stock = v.stock === '' ? null : Number(v.stock);
    v.active = f.elements.active.checked;
    try {
      await api('/api/admin/products', existing ? 'PUT' : 'POST', { ...p, ...v });
      dashboard = await api('/api/admin/dashboard');
      editor.close();
      editor.remove();
      draw();
      notify('Producto guardado');
    } catch (err) {
      status.textContent = err.message;
    } finally {
      b.disabled = false;
    }
  };
}
