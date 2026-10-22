const paths = {
  user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 22v-3a8 6 0 0 1 16 0v3',
  cart: 'M2 3h3l3 13h11l3-10H6M10 21h.01M18 21h.01',
  menu: 'M3 5h18M3 12h18M3 19h18',
  chevron: 'm9 5 7 7-7 7',
  grid: 'M3 3h6v6H3V3Zm12 0h6v6h-6V3ZM3 15h6v6H3v-6Zm12 0h6v6h-6v-6Z',
  stroller: 'M5 3h7a7 7 0 0 1 7 7H5V3Zm0 7 3 8h10l3-8M2 3h3M9 21h.01M18 21h.01',
  crib: 'M3 8h18v12M3 4v16M3 16h18M8 8v8m4-8v8m4-8v8M5 4h3m8 0h3',
  rocker: 'M8 3h8l2 13H6L8 3Zm-3 18c4 2 10 2 14 0M8 16l-2 5m10-5 2 5',
  chair: 'M7 3h10v7H7V3Zm-3 8h16M7 11v5h10v-5M8 16l-2 6m10-6 2 6',
  bath: 'M2 10h20l-3 9H5L2 10Zm3 9v3m14-3v3M6 10V4a2 2 0 0 1 4 0',
  box: 'M3 6l9-4 9 4v13l-9 4-9-4V6Zm0 0 9 4 9-4M12 10v13M7 4l10 4v5',
  headset: 'M4 14v-3a8 8 0 0 1 16 0v3M4 12H2v7h5v-7H4Zm16 0h2v7h-5v-7h3Zm0 7c0 3-3 3-7 3',
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
