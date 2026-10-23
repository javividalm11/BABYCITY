const normalize = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export function mountCatalogFilters(root) {
  const search = root.querySelector('#catalogSearch');
  if (!search) return;
  const buttons = [...root.querySelectorAll('[data-collection-filter]')];
  const more = root.querySelector('#catalogMore');
  const cards = [...root.querySelectorAll('[data-collection-title]')];
  let category = 'Todos';
  const update = () => {
    const query = normalize(search.value);
    let count = 0;
    cards.forEach((card) => {
      const title = normalize(card.dataset.collectionTitle);
      card.hidden = !(
        title.includes(query) &&
        (category === 'Todos' || title.includes(normalize(category)))
      );
      if (!card.hidden) count++;
    });
    buttons.forEach((button) =>
      button.setAttribute('aria-pressed', String(button.dataset.collectionFilter === category)),
    );
    root.querySelector('.collections-empty').hidden = count > 0;
    root.querySelector('#catalogResults').textContent = `${count} colecciones disponibles`;
  };
  search.addEventListener('input', update);
  buttons.forEach((button) =>
    button.addEventListener('click', () => {
      category = button.dataset.collectionFilter;
      more.value = '';
      update();
    }),
  );
  more.addEventListener('change', () => {
    category = more.value || 'Todos';
    update();
  });
}
