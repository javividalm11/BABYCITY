export const STATUS_LABELS = {
  solicitud: 'Solicitud recibida',
  contactado: 'Cliente contactado',
  confirmado: 'Pedido confirmado',
  enviado: 'Enviado',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

export const ACTION_LABELS = {
  login: 'Inicio de sesión',
  'login.fallido': 'Intento fallido de ingreso',
  logout: 'Cierre de sesión',
  'producto.crear': 'Producto creado',
  'producto.editar': 'Producto editado',
  'producto.eliminar': 'Producto eliminado',
  'tarifas.editar': 'Tarifas editadas',
  'pedido.estado': 'Estado de pedido',
  'pedido.nota': 'Nota de pedido',
  'pedido.eliminar': 'Pedido eliminado',
  'cuenta.clave': 'Contraseña cambiada',
  'cuenta.sesiones': 'Otras sesiones cerradas',
  'consulta.atendido': 'Consulta atendida',
  'reclamo.atendido': 'Reclamo atendido',
};

export const DELIVERY_LABELS = {
  pickup: 'Recojo en tienda',
  lima: 'Envío a Lima',
  province: 'Envío a provincias',
};

export const formatDateTime = (iso) => new Date(iso).toLocaleString('es-PE');

export function daysSince(iso) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'Hoy';
  return days === 1 ? 'Hace 1 día' : `Hace ${days} días`;
}
