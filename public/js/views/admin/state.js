export const TABS = [
  ['products', 'Productos'],
  ['orders', 'Pedidos'],
  ['leads', 'Consultas'],
  ['claims', 'Reclamaciones'],
  ['activity', 'Actividad'],
  ['settings', 'Envíos y respaldo'],
];

export const IDLE_MS = 30 * 60 * 1000;

// Estado del panel. Los módulos que no pueden importarse entre sí se llaman mediante estos enlaces.
export const admin = {
  main: null,
  dashboard: null,
  tab: 'products',
  enter: async () => {},
  redraw: () => {},
  showLogin: () => {},
};

export const pendingCount = () =>
  [...admin.dashboard.leads, ...admin.dashboard.claims].filter((r) => !r.data.handled).length;

export const openOrders = () =>
  admin.dashboard.orders.filter((o) => !['completado', 'cancelado'].includes(o.status));
