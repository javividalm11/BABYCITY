import { esc, money } from '../../../lib/format.js';
import { openProductEditor } from '../product-editor.js';
import { admin } from '../state.js';

const FILTERS = [
  ['all', 'Todos'],
  ['published', 'Publicados'],
  ['hidden', 'Ocultos'],
  ['unconfirmed', 'Existencias por confirmar'],
  ['soldout', 'Agotados'],
];

const MATCH = {
  all: () => true,
  published: (p) => p.active,
  hidden: (p) => !p.active,
  unconfirmed: (p) => p.stock === null,
  soldout: (p) => p.stock === 0,
};

const view = { query: '', filter: 'all' };

const row = (p) =>
  `<tr><td><img src="${esc(p.image)}" alt=""></td><td>${esc(p.name)}<small>${esc(p.sku)} · ${esc(p.category)}</small></td><td>${money(p.price)}</td><td>${p.stock === null ? 'Por confirmar' : esc(p.stock)}</td><td>${p.active ? 'Publicado' : 'Oculto'}</td><td><button data-edit="${p.id}">Editar</button></td></tr>`;

function drawRows(panel) {
  const query = view.query.toLowerCase();
  const list = admin.dashboard.products.filter(
    (p) => MATCH[view.filter](p) && `${p.name} ${p.sku}`.toLowerCase().includes(query),
  );
  panel.querySelector('#adminRows').innerHTML = list.map(row).join('');
  panel.querySelector('#adminCount').textContent =
    `${list.length} de ${admin.dashboard.products.length} productos`;
  panel.querySelectorAll('[data-edit]').forEach((button) => {
    button.onclick = () =>
      openProductEditor(admin.dashboard.products.find((p) => p.id === Number(button.dataset.edit)));
  });
}

export function renderProducts(panel) {
  const options = FILTERS.map(
    ([id, label]) =>
      `<option value="${id}" ${view.filter === id ? 'selected' : ''}>${label}</option>`,
  ).join('');
  panel.innerHTML = `<div class="admin-tools"><div class="admin-filters"><input id="adminSearch" type="search" placeholder="Buscar producto o código…" aria-label="Buscar productos" value="${esc(view.query)}"><select id="adminFilter" aria-label="Filtrar productos">${options}</select></div><button id="newProduct" class="btn primary">+ Agregar producto</button></div><p class="fine" id="adminCount" role="status"></p><div class="table-wrap"><table><thead><tr><th>Imagen</th><th>Producto</th><th>Precio</th><th>Existencias</th><th>Estado</th><th>Acciones</th></tr></thead><tbody id="adminRows"></tbody></table></div><p class="fine">«Por confirmar» indica que el catálogo no especifica cantidades. Stock 0 muestra «Agotado». Las solicitudes no reservan existencias: actualízalas al confirmar cada venta.</p>`;
  drawRows(panel);
  panel.querySelector('#adminSearch').oninput = (event) => {
    view.query = event.target.value;
    drawRows(panel);
  };
  panel.querySelector('#adminFilter').onchange = (event) => {
    view.filter = event.target.value;
    drawRows(panel);
  };
  panel.querySelector('#newProduct').onclick = () => openProductEditor();
}
