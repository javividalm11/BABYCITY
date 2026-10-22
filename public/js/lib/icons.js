const paths = {
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  heart:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  bag: 'M5 7h14l2 14H3L5 7Zm3 0V5a4 4 0 0 1 8 0v2',
  truck:
    'M1 4h13v12H1V4Zm13 5h5l3 4v3h-8M8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm12 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
  shield: 'M12 2l8 4v6c0 5-8 10-8 10S4 17 4 12V6l8-4Zm-4 10 3 3 5-6',
  chat: 'M21 11a9 9 0 0 1-9 9 10 10 0 0 1-4-.9L2 21l1.8-5.4A9 9 0 1 1 21 11ZM8 8c0 4 2 6 6 7l2-2-3-2-1 1-2-2 1-1-2-3-1 2',
  store: 'M3 10v11h18V10M2 3h20l-2 7H4L2 3Zm6 18v-7h8v7',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  check: 'M20 6 9 17l-5-5',
  book: 'M12 5v16M3 3c4 0 6 0 9 2 3-2 5-2 9-2v16c-4 0-6 0-9 2-3-2-5-2-9-2V3',
};
export const icon = (name) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.heart}"/></svg>`;
