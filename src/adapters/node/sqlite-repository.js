import { DatabaseSync } from 'node:sqlite';
import {
  AUDIT_RETENTION_MS,
  DEFAULT_SETTINGS,
  HANDLED_SQL,
  HANDLED_TABLES,
  parseRecord,
  RATE_LIMIT_SQL,
  SCHEMA,
  TOUCH_SESSION_SQL,
} from '../schema.js';

const parse = (row) => (row ? JSON.parse(row.data) : null);

// Implemento el contrato del repositorio sobre SQLite.
export class SqliteRepository {
  constructor(path) {
    this.db = new DatabaseSync(path);
    if (path !== ':memory:') this.db.exec('PRAGMA journal_mode=WAL');
    this.db.exec('PRAGMA foreign_keys=ON');
  }

  #transaction(work) {
    this.db.exec('BEGIN');
    try {
      work();
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  async init(seedProducts) {
    for (const sql of SCHEMA) this.db.exec(sql);
    const { n } = this.db.prepare('SELECT count(*) n FROM products').get();
    if (!n) {
      const insert = this.db.prepare('INSERT INTO products VALUES (?, ?)');
      this.#transaction(() => seedProducts.forEach((p) => insert.run(p.id, JSON.stringify(p))));
    }
    this.db.prepare('INSERT OR IGNORE INTO settings VALUES (1, ?)').run(DEFAULT_SETTINGS);
  }

  async listProducts() {
    return this.db.prepare('SELECT data FROM products ORDER BY id').all().map(parse);
  }

  async getProduct(id) {
    return parse(this.db.prepare('SELECT data FROM products WHERE id = ?').get(id));
  }

  async nextProductId() {
    return this.db.prepare('SELECT coalesce(max(id), 0) + 1 id FROM products').get().id;
  }

  async saveProduct(product) {
    this.db
      .prepare('INSERT OR REPLACE INTO products VALUES (?, ?)')
      .run(product.id, JSON.stringify(product));
  }

  async deleteProduct(id) {
    return this.db.prepare('DELETE FROM products WHERE id = ?').run(id).changes > 0;
  }

  async getSettings() {
    return parse(this.db.prepare('SELECT data FROM settings WHERE id = 1').get());
  }

  async saveSettings(settings) {
    this.db.prepare('UPDATE settings SET data = ? WHERE id = 1').run(JSON.stringify(settings));
  }

  async findAdmin(username) {
    return this.db.prepare('SELECT * FROM admins WHERE username = ?').get(username) ?? null;
  }

  async replaceAdmin(username, salt, hash) {
    this.#transaction(() => {
      this.db.exec('DELETE FROM admins');
      this.db.prepare('INSERT INTO admins VALUES (?, ?, ?)').run(username, salt, hash);
      this.db.exec('DELETE FROM admin_sessions');
    });
  }

  async createSession(hash, username, idleExpires, absoluteExpires) {
    this.db
      .prepare('INSERT INTO admin_sessions VALUES (?, ?, ?, ?)')
      .run(hash, username, idleExpires, absoluteExpires);
  }

  async touchSession(hash, now, idleMs) {
    const row = this.db.prepare(TOUCH_SESSION_SQL).get(now + idleMs, hash, now, now);
    return row ? { username: row.username } : null;
  }

  async removeSession(hash) {
    this.db.prepare('DELETE FROM admin_sessions WHERE hash = ?').run(hash);
  }

  async purgeExpired(now) {
    this.db
      .prepare('DELETE FROM admin_sessions WHERE idle_expires < ? OR absolute_expires < ?')
      .run(now, now);
    this.db.prepare('DELETE FROM rate_limits WHERE until < ?').run(now);
    const limit = new Date(now - AUDIT_RETENTION_MS).toISOString();
    this.db.prepare('DELETE FROM audit_log WHERE at < ?').run(limit);
  }

  async addOrder(id, created, status, data) {
    this.db
      .prepare('INSERT INTO orders VALUES (?, ?, ?, ?)')
      .run(id, created, status, JSON.stringify(data));
  }

  async listOrders() {
    return this.db.prepare('SELECT * FROM orders ORDER BY created DESC').all().map(parseRecord);
  }

  async setOrderStatus(id, status) {
    return this.db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id).changes > 0;
  }

  async deleteOrder(id) {
    return this.db.prepare('DELETE FROM orders WHERE id = ?').run(id).changes > 0;
  }

  async setOrderNote(id, note) {
    const sql = "UPDATE orders SET data = json_set(data, '$.internalNote', ?) WHERE id = ?";
    return this.db.prepare(sql).run(note, id).changes > 0;
  }

  async addLead(id, created, data) {
    this.db.prepare('INSERT INTO leads VALUES (?, ?, ?)').run(id, created, JSON.stringify(data));
  }

  async listLeads() {
    return this.db.prepare('SELECT * FROM leads ORDER BY created DESC').all().map(parseRecord);
  }

  async addClaim(id, created, data) {
    this.db.prepare('INSERT INTO claims VALUES (?, ?, ?)').run(id, created, JSON.stringify(data));
  }

  async listClaims() {
    return this.db.prepare('SELECT * FROM claims ORDER BY created DESC').all().map(parseRecord);
  }

  async setHandled(kind, id, handled, at) {
    const table = HANDLED_TABLES[kind];
    if (!table) throw new Error('Tipo de registro no permitido');
    return this.db.prepare(HANDLED_SQL(table)).run(String(handled), at, id).changes > 0;
  }

  async hitRateLimit(key, now, windowMs) {
    const until = now + windowMs;
    return this.db.prepare(RATE_LIMIT_SQL).get(key, until, now, now, until).n;
  }

  async addAudit(at, actor, action, target, detail) {
    this.db
      .prepare('INSERT INTO audit_log(at, actor, action, target, detail) VALUES (?, ?, ?, ?, ?)')
      .run(at, actor, action, target, detail);
  }

  async listAudit(limit) {
    return this.db.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT ?').all(limit);
  }

  close() {
    this.db.close();
  }
}
