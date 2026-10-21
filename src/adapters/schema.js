// Esquema compartido por los dos repositorios (SQLite y D1).
export const SCHEMA = [
  'CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY, data TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS admins(username TEXT PRIMARY KEY, salt TEXT NOT NULL, hash TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY, expires INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY, created TEXT NOT NULL, status TEXT NOT NULL, data TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS leads(id TEXT PRIMARY KEY, created TEXT NOT NULL, data TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS claims(id TEXT PRIMARY KEY, created TEXT NOT NULL, data TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS settings(id INTEGER PRIMARY KEY, data TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS rate_limits(k TEXT PRIMARY KEY, n INTEGER NOT NULL, until INTEGER NOT NULL)',
];

export const DEFAULT_SETTINGS = JSON.stringify({ lima: null, province: null });

// Cuento un intento y reinicio la ventana cuando ya venció.
export const RATE_LIMIT_SQL = `INSERT INTO rate_limits(k, n, until) VALUES (?, 1, ?)
ON CONFLICT(k) DO UPDATE SET
  n = CASE WHEN until < ? THEN 1 ELSE n + 1 END,
  until = CASE WHEN until < ? THEN ? ELSE until END
RETURNING n`;

export const parseRecord = (row) => ({ ...row, data: JSON.parse(row.data) });
