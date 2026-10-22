// Defino el esquema una sola vez para todos los repositorios.
export const SCHEMA = [
  'CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY, data TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS admins(username TEXT PRIMARY KEY, salt TEXT NOT NULL, hash TEXT NOT NULL)',
  // Reemplazo la tabla anterior de sesiones por una con caducidad por inactividad.
  'DROP TABLE IF EXISTS sessions',
  'CREATE TABLE IF NOT EXISTS admin_sessions(hash TEXT PRIMARY KEY, username TEXT NOT NULL, idle_expires INTEGER NOT NULL, absolute_expires INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY, created TEXT NOT NULL, status TEXT NOT NULL, data TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS leads(id TEXT PRIMARY KEY, created TEXT NOT NULL, data TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS claims(id TEXT PRIMARY KEY, created TEXT NOT NULL, data TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS settings(id INTEGER PRIMARY KEY, data TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS rate_limits(k TEXT PRIMARY KEY, n INTEGER NOT NULL, until INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS audit_log(id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL, target TEXT NOT NULL, detail TEXT NOT NULL)',
];

export const DEFAULT_SETTINGS = JSON.stringify({ lima: null, province: null });

// Cuento el intento y reinicio la ventana cuando ya venció.
export const RATE_LIMIT_SQL = `INSERT INTO rate_limits(k, n, until) VALUES (?, 1, ?)
ON CONFLICT(k) DO UPDATE SET
  n = CASE WHEN until < ? THEN 1 ELSE n + 1 END,
  until = CASE WHEN until < ? THEN ? ELSE until END
RETURNING n`;

// Renuevo la inactividad sin pasar del tope absoluto; devuelvo el usuario si la sesión sigue viva.
export const TOUCH_SESSION_SQL = `UPDATE admin_sessions
SET idle_expires = min(?, absolute_expires)
WHERE hash = ? AND idle_expires > ? AND absolute_expires > ?
RETURNING username`;

// Solo estas tablas aceptan la marca de atendido.
export const HANDLED_TABLES = { lead: 'leads', claim: 'claims' };
export const HANDLED_SQL = (table) =>
  `UPDATE ${table} SET data = json_set(data, '$.handled', json(?), '$.handledAt', ?) WHERE id = ?`;

export const AUDIT_RETENTION_MS = 180 * 24 * 60 * 60 * 1000;

export const parseRecord = (row) => ({ ...row, data: JSON.parse(row.data) });
