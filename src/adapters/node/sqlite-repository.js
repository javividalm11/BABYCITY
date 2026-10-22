import { DatabaseSync } from 'node:sqlite';
import { DEFAULT_SETTINGS, parseRecord, RATE_LIMIT_SQL, SCHEMA } from '../schema.js';

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
      this.db.exec('DELETE FROM sessions');
    });
  }

  async createSession(hash, expires) {
    this.db.prepare('INSERT INTO sessions VALUES (?, ?)').run(hash, expires);
  }

  async findSession(hash, now) {
    return Boolean(
      this.db.prepare('SELECT hash FROM sessions WHERE hash = ? AND expires > ?').get(hash, now),
    );
  }

  async removeSession(hash) {
    this.db.prepare('DELETE FROM sessions WHERE hash = ?').run(hash);
  }

  async purgeSessions(now) {
    this.db.prepare('DELETE FROM sessions WHERE expires < ?').run(now);
    this.db.prepare('DELETE FROM rate_limits WHERE until < ?').run(now);
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

  async hitRateLimit(key, now, windowMs) {
    const until = now + windowMs;
    return this.db.prepare(RATE_LIMIT_SQL).get(key, until, now, now, until).n;
  }

  close() {
    this.db.close();
  }
}
