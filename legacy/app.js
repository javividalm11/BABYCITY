const products = [
  { id: 1, sku: '154715316', brand: 'EBABY', name: 'Coche Moisés plegable para Bebé Sundance Edición Limitada Gray', cat: 'Coches', price: 279, old: 699, discount: '-60%', image: 'product-01.webp' },
  { id: 2, sku: '155213346', brand: 'Baby', name: 'Silla mecedora para bebé MELODY color BEIGE', cat: 'Mecedoras', price: 295, old: 799, discount: '-63%', image: 'product-02.webp', reviews: 1 },
  { id: 3, sku: '154578029', brand: 'GOLDEN', name: 'Triciclo Evolutivo Giratorio 360° Voyage Edition Color Arena/Dorado – Capacidad hasta 25 kg', cat: 'Triciclos', price: 299, old: 599, discount: '-50%', image: 'product-03.webp' },
  { id: 4, sku: '154587986', brand: 'Baby', name: 'Canguro Portabebé Ergonómico Love 4 en 1 con Asiento de Cadera – Rosado Pastel', cat: 'Portabebés', price: 95, old: 199, discount: '-52%', image: 'product-04.webp' },
  { id: 5, sku: '155239203', brand: 'GENERICO', name: 'Mecedora Portátil y Mesa de Comer Milan DELUXE', cat: 'Mecedoras', price: 319, old: 849, discount: '-62%', image: 'product-05.webp' },
  { id: 6, sku: '146093472', brand: 'EBABY', name: 'COCHE MALETA RUDI PREMIUM COMPACTO', cat: 'Coches', price: 305, old: 899, discount: '-66%', image: 'product-06.webp' },
  { id: 7, sku: '154575002', brand: 'GENERICO', name: 'Peluche Arrullador Conejo para Bebé con Palmada Calmante y Función de Apego Rosa', cat: 'Juguetes', price: 115, old: 219, discount: '-47%', image: 'product-07.webp' },
  { id: 8, sku: '154967928', brand: 'EBABY', name: 'Cuna Corral 4 en 1 Dacora Azul – Colecho, Cambiador, Mosquitero, Mecedora y Corral de Juegos', cat: 'Cunas', price: 799, old: null, discount: 'Nuevo', image: 'product-08.webp' },
  { id: 9, sku: '155386205', brand: 'GENERICO', name: 'Triciclo Infantil Golden Voyage 360° Negro Dorado Reclinable con Bluetooth USB', cat: 'Triciclos', price: 295, old: 499, discount: '-41%', image: 'product-09.webp' },
  { id: 10, sku: '154589049', brand: 'TOP', name: 'Peluche Interactivo Arrullador para Bebés con Función de Palmadas Cisne', cat: 'Juguetes', price: 99, old: 219, discount: '-55%', image: 'product-10.webp' },
  { id: 11, sku: '154587957', brand: 'Baby', name: 'Canguro Portabebé Ergonómico Love 4 en 1 con Asiento de Cadera – Azul Marino', cat: 'Portabebés', price: 99, old: 199, discount: '-50%', image: 'product-11.webp' },
  { id: 12, sku: '155822563', brand: 'EBABY', name: 'Coche Moises de Lujo Saturno 126-1 Beige', cat: 'Coches', price: 299, old: 799, discount: '-63%', image: 'product-12.webp' },
  { id: 13, sku: '146302409', brand: 'EBABY', name: 'Coche Maleta Rudi Plegable y Portátil para Bebés', cat: 'Coches', price: 309, old: 799, discount: '-61%', image: 'product-13.webp' },
  { id: 14, sku: '146087907', brand: 'EBABY', name: 'COCHE CUNA MOISES COMFORT DE LUJO CON PORTABEBE COLOR AZUL', cat: 'Coches', price: 799, old: null, discount: 'Nuevo', image: 'product-14.webp' }
];

let cart = [];
let currentProduct = null;
const grid = document.querySelector('#productGrid');
const money = number => `S/ ${number}`;

function renderProducts(filter = 'Todos') {
  const list = filter === 'Todos' ? products : products.filter(product => product.cat === filter);
  grid.innerHTML = list.map(product => `
    <article class="product-card" data-product="${product.id}" tabindex="0" role="button" aria-label="Ver detalles de ${product.name}">
      <div class="product-image">
        <span class="badge">${product.discount}</span>
        <button class="wish" aria-label="Guardar favorito">♡</button>
        <img src="assets/products/${product.image}" alt="${product.name}" loading="lazy">
      </div>
      <div class="product-info">
        <span class="product-cat">${product.brand} · ${product.cat}</span>
        <h3>${product.name}</h3>
        <div class="seller">Por <b>BABY STORE</b>${product.reviews ? ` <span>· ${product.reviews} opinión</span>` : ''}</div>
        <div class="price-row">
          <div class="price"><strong>${money(product.price)}</strong>${product.old ? `<del>${money(product.old)}</del>` : ''}</div>
          <button class="add-button" data-add="${product.id}" aria-label="Agregar ${product.name}">+</button>
        </div>
      </div>
    </article>`).join('');
}

function renderCart() {
  const items = document.querySelector('#cartItems');
  const empty = document.querySelector('#cartEmpty');
  const footer = document.querySelector('#cartFooter');
  items.innerHTML = cart.map((product, index) => `
    <div class="cart-item">
      <div class="cart-thumb"><img src="assets/products/${product.image}" alt=""></div>
      <div class="cart-item-info"><b>${product.name}</b><small>${money(product.price)}</small><button data-remove="${index}">Quitar</button></div>
    </div>`).join('');
  document.querySelector('#cartCount').textContent = cart.length;
  document.querySelector('#cartTotal').textContent = money(cart.reduce((sum, product) => sum + product.price, 0));
  empty.style.display = cart.length ? 'none' : 'block';
  footer.style.display = cart.length ? 'block' : 'none';
}

function toggleCart(open) {
  document.querySelector('#cartDrawer').classList.toggle('open', open);
  document.querySelector('#overlay').classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}

const productCopy = {
  Coches: {
    description: 'Un coche pensado para acompañar los paseos y traslados del bebé con una propuesta práctica y elegante.',
    features: ['Ideal para paseos y salidas familiares', 'Modelo y acabado según la fotografía', 'Asesoría personalizada antes de comprar']
  },
  Mecedoras: {
    description: 'Una opción cómoda para crear momentos de descanso, calma y cercanía durante la rutina diaria del bebé.',
    features: ['Diseñada para el descanso del bebé', 'Formato práctico para usar en casa', 'Modelo y color según la fotografía']
  },
  Triciclos: {
    description: 'Una alternativa evolutiva para disfrutar paseos cómodos mientras el pequeño descubre nuevas aventuras.',
    features: ['Sistema giratorio 360°', 'Diseño evolutivo para distintas etapas', 'Modelo y capacidad según la ficha publicada']
  },
  Portabebés: {
    description: 'Portabebé ergonómico para mantener al bebé cerca y tener mayor libertad de movimiento durante las salidas.',
    features: ['Configuración 4 en 1', 'Incluye asiento de cadera', 'Color según la variante seleccionada']
  },
  Juguetes: {
    description: 'Un compañero suave creado para aportar calma, apego y ternura en los momentos de descanso del bebé.',
    features: ['Función arrulladora interactiva', 'Diseño suave para acompañar al bebé', 'Modelo según la fotografía']
  },
  Cunas: {
    description: 'Una solución versátil para el descanso y cuidado diario del bebé, pensada para aprovechar mejor cada espacio.',
    features: ['Formato cuna corral 4 en 1', 'Incluye colecho, cambiador y mosquitero', 'Función mecedora y corral de juegos']
  }
};

function openProduct(product) {
  currentProduct = product;
  const copy = productCopy[product.cat];
  document.querySelector('#modalProductImage').src = `assets/products/${product.image}`;
  document.querySelector('#modalProductImage').alt = product.name;
  document.querySelector('#modalProductBrand').textContent = `${product.brand} · ${product.cat} · SKU ${product.sku}`;
  document.querySelector('#productModalTitle').textContent = product.name;
  document.querySelector('#modalProductPrice').textContent = money(product.price);
  const oldPrice = document.querySelector('#modalProductOld');
  oldPrice.textContent = product.old ? money(product.old) : '';
  oldPrice.style.display = product.old ? '' : 'none';
  document.querySelector('#modalProductDiscount').textContent = product.discount;
  document.querySelector('#modalProductDescription').textContent = copy.description;
  document.querySelector('#modalProductFeatures').innerHTML = copy.features.map(feature => `<li>${feature}</li>`).join('');
  document.querySelector('#productModal').classList.add('open');
  document.querySelector('#overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModals() {
  document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('open'));
  document.querySelector('#overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function openCustomerForm() {
  if (!currentProduct) return;
  document.querySelector('#productModal').classList.remove('open');
  document.querySelector('#orderSummary').innerHTML = `<img src="assets/products/${currentProduct.image}" alt=""><div><b>${currentProduct.name}</b><small>${money(currentProduct.price)}</small></div>`;
  document.querySelector('#customerModal').classList.add('open');
  document.querySelector('#overlay').classList.add('open');
  setTimeout(() => document.querySelector('#customerForm input[name="name"]').focus(), 100);
}

document.addEventListener('click', event => {
  const add = event.target.closest('[data-add]');
  if (add) {
    cart.push(products.find(product => product.id === Number(add.dataset.add)));
    renderCart();
    const toast = document.querySelector('#toast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1800);
  }

  const remove = event.target.closest('[data-remove]');
  if (remove) {
    cart.splice(Number(remove.dataset.remove), 1);
    renderCart();
  }

  const wish = event.target.closest('.wish');
  if (wish) {
    wish.classList.toggle('active');
    wish.textContent = wish.classList.contains('active') ? '♥' : '♡';
  }

  const filter = event.target.closest('[data-filter]');
  if (filter) {
    document.querySelectorAll('[data-filter]').forEach(button => button.classList.remove('active'));
    filter.classList.add('active');
    renderProducts(filter.dataset.filter);
  }

  const category = event.target.closest('[data-filter-link]');
  if (category) {
    const target = [...document.querySelectorAll('[data-filter]')].find(button => button.dataset.filter === category.dataset.filterLink);
    if (target) {
      document.querySelectorAll('[data-filter]').forEach(button => button.classList.remove('active'));
      target.classList.add('active');
      renderProducts(category.dataset.filterLink);
    }
  }

  const productCard = event.target.closest('[data-product]');
  if (productCard && !event.target.closest('button')) {
    openProduct(products.find(product => product.id === Number(productCard.dataset.product)));
  }
});

document.querySelector('#cartOpen').onclick = () => toggleCart(true);
document.querySelector('#cartClose').onclick = () => toggleCart(false);
document.querySelector('#overlay').onclick = () => { toggleCart(false); closeModals(); };
document.querySelectorAll('[data-close-modal]').forEach(button => button.onclick = closeModals);
document.querySelector('#buyNow').onclick = openCustomerForm;
document.querySelector('#modalAddCart').onclick = () => {
  if (!currentProduct) return;
  cart.push(currentProduct);
  renderCart();
  const toast = document.querySelector('#toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
};
document.querySelector('#menuButton').onclick = () => document.querySelector('#mobileNav').classList.toggle('open');
document.querySelectorAll('#mobileNav a').forEach(link => link.onclick = () => document.querySelector('#mobileNav').classList.remove('open'));
document.querySelector('#checkout').onclick = () => {
  const lines = cart.map(product => `• ${product.name} — ${money(product.price)}`).join('\n');
  const total = cart.reduce((sum, product) => sum + product.price, 0);
  const message = `Hola Baby City 💕 Quisiera hacer este pedido:\n\n${lines}\n\nSubtotal: ${money(total)}\n\n¿Me ayudan con la entrega?`;
  window.open(`https://wa.me/51937473120?text=${encodeURIComponent(message)}`, '_blank');
};

document.querySelector('#customerForm').addEventListener('submit', event => {
  event.preventDefault();
  if (!currentProduct) return;
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  const message = `Hola Baby City 💕 Quisiera solicitar este producto:\n\n` +
    `PRODUCTO\n• ${currentProduct.name}\n• SKU: ${currentProduct.sku}\n• Precio publicado: ${money(currentProduct.price)}\n\n` +
    `DATOS DEL CLIENTE\n• Nombre: ${data.name}\n• Celular: ${data.phone}\n• DNI: ${data.dni || 'No indicado'}\n` +
    `• Ciudad: ${data.city}\n• Distrito: ${data.district}\n• Dirección: ${data.address}\n• Referencia: ${data.reference || 'No indicada'}\n` +
    `• Entrega: ${data.delivery}\n• Pago: ${data.payment}\n• Indicaciones: ${data.notes || 'Ninguna'}\n\n¿Me ayudan a confirmar disponibilidad y envío?`;
  window.open(`https://wa.me/51937473120?text=${encodeURIComponent(message)}`, '_blank');
  closeModals();
  event.currentTarget.reset();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeModals();
  if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-product]')) {
    event.preventDefault();
    openProduct(products.find(product => product.id === Number(event.target.dataset.product)));
  }
});

renderProducts();
renderCart();

const header = document.querySelector('.header');
const hero = document.querySelector('.hero');
function updateHeaderBackground() {
  const heroLimit = hero.offsetTop + hero.offsetHeight - header.offsetHeight;
  header.classList.toggle('scrolled', window.scrollY >= heroLimit);
}
window.addEventListener('scroll', updateHeaderBackground, { passive: true });
window.addEventListener('resize', updateHeaderBackground);
updateHeaderBackground();
