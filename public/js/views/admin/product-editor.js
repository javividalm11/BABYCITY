import { esc } from '../../lib/format.js';
import { notify } from '../../lib/notify.js';
import { api } from '../../lib/api.js';
import { request } from './request.js';
import { admin } from './state.js';

let editor = null;

const BLANK_PRODUCT = {
  name: '',
  sku: '',
  category: 'Accesorios',
  price: 0,
  stock: null,
  active: true,
  description: '',
};

const unique = (values) => [...new Set(values)];

function imageLibrary(selected) {
  return unique(admin.dashboard.products.map((p) => p.image))
    .map(
      (src) =>
        `<button type="button" data-image="${esc(src)}" class="${selected === src ? 'selected' : ''}" aria-label="Usar esta imagen"><img src="${esc(src)}" alt="Imagen de producto" loading="lazy"></button>`,
    )
    .join('');
}

function template(product, isNew) {
  const categories = unique(admin.dashboard.products.map((p) => p.category))
    .map((c) => `<option value="${esc(c)}">`)
    .join('');
  const remove = isNew
    ? ''
    : '<button type="button" class="btn danger" id="deleteProduct">Eliminar producto</button>';
  return `<button class="close" data-close aria-label="Cerrar">×</button><span class="eyebrow">Cuida cada detalle</span><h2>${isNew ? 'Nuevo producto' : 'Editar producto'}</h2><form id="productEdit"><div class="form-grid"><label class="span-2">Nombre<input name="name" required maxlength="180" value="${esc(product.name)}"></label><label>Código<input name="sku" maxlength="60" value="${esc(product.sku)}"></label><label>Categoría<input name="category" required list="categoryNames" maxlength="80" value="${esc(product.category)}"><datalist id="categoryNames">${categories}</datalist></label><label>Precio (S/)<input name="price" type="number" min="0" max="100000" step="0.01" required value="${esc(product.price)}"></label><label>Stock (vacío = por confirmar)<input name="stock" type="number" min="0" max="100000" step="1" value="${esc(product.stock ?? '')}"></label><label class="span-2">Descripción<textarea name="description" maxlength="3000" rows="4">${esc(product.description)}</textarea></label><label class="span-2">Imagen actual<img class="preview-upload" id="selectedImage" src="${esc(product.image)}" alt="Imagen seleccionada"><input type="hidden" name="image" value="${esc(product.image)}"></label><label class="span-2">Subir imagen (PNG, JPG, WebP · hasta 1 MB)<input id="imageUpload" type="file" accept="image/png,image/jpeg,image/webp"></label><div class="span-2"><p class="fine">O elige una imagen de la biblioteca:</p><div class="image-library">${imageLibrary(product.image)}</div></div><label class="check span-2"><input name="active" type="checkbox" ${product.active ? 'checked' : ''}>Publicar en la tienda (desactiva para ocultarlo)</label></div><div class="admin-actions"><button class="btn primary">Guardar producto →</button>${remove}</div><p class="form-status" role="status"></p></form>`;
}

const readAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

function closeEditor() {
  editor.close();
  editor.remove();
  editor = null;
}

async function reloadAfterChange(message) {
  admin.dashboard = await api('/api/admin/dashboard');
  closeEditor();
  admin.redraw();
  notify(message);
}

function bindImagePicker(form, status) {
  const choose = (src) => {
    form.elements.image.value = src;
    editor.querySelector('#selectedImage').src = src;
    editor
      .querySelectorAll('[data-image]')
      .forEach((b) => b.classList.toggle('selected', b.dataset.image === src));
  };
  editor
    .querySelectorAll('[data-image]')
    .forEach((b) => (b.onclick = () => choose(b.dataset.image)));
  editor.querySelector('#imageUpload').onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 1_048_576) {
      status.textContent = 'La imagen debe pesar como máximo 1 MB.';
      return;
    }
    try {
      status.textContent = 'Subiendo imagen…';
      const { image } = await request('/api/admin/images', 'POST', {
        base64: await readAsBase64(file),
      });
      choose(image);
      status.textContent = 'Imagen lista.';
    } catch (error) {
      status.textContent = error.message;
    }
  };
}

function readForm(form, product) {
  const values = Object.fromEntries(new FormData(form));
  return {
    ...product,
    ...values,
    price: Number(values.price),
    stock: values.stock === '' ? null : Number(values.stock),
    active: form.elements.active.checked,
  };
}

// Abro el formulario para crear un producto o editar uno existente.
export function openProductEditor(existing) {
  const product = existing || { ...BLANK_PRODUCT, image: admin.dashboard.products[0].image };
  editor?.remove();
  editor = document.createElement('dialog');
  editor.className = 'admin-editor';
  editor.innerHTML = template(product, !existing);
  document.body.append(editor);
  editor.showModal();
  const form = editor.querySelector('form');
  const status = form.querySelector('.form-status');
  bindImagePicker(form, status);
  form.onsubmit = async (event) => {
    event.preventDefault();
    const button = form.querySelector('button:not([type=button])');
    button.disabled = true;
    try {
      await request('/api/admin/products', existing ? 'PUT' : 'POST', readForm(form, product));
      await reloadAfterChange('Producto guardado');
    } catch (error) {
      status.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  };
  const remove = form.querySelector('#deleteProduct');
  if (remove) {
    remove.onclick = async () => {
      const question = `¿Eliminar «${product.name}»? Esta acción no se puede deshacer. Si solo quieres ocultarlo, desmarca «Publicar en la tienda».`;
      if (!window.confirm(question)) return;
      try {
        await request(`/api/admin/products/${product.id}`, 'DELETE');
        await reloadAfterChange('Producto eliminado');
      } catch (error) {
        status.textContent = error.message;
      }
    };
  }
}
