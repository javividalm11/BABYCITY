import { DEFAULT_SETTINGS, parseRecord, RATE_LIMIT_SQL, SCHEMA } from '../schema.js';

const parse = (row) => (row ? JSON.parse(row.data) : null);

// Implemento el contrato del repositorio sobre D1.
export class D1Repository {
  constructor(db) {
    this.db = db;
  }

  #run(sql, ...values) {
    return this.db
      .prepare(sql)
      .bind(...values)
      .run();
  }

  async init(seedProducts) {
    await this.db.batch(SCHEMA.map((sql) => this.db.prepare(sql)));
    const { n } = await this.db.prepare('SELECT count(*) n FROM products').first();
    if (!n) {
      const insert = this.db.prepare('INSERT INTO products VALUES (?, ?)');
      await this.db.batch(seedProducts.map((p) => insert.bind(p.id, JSON.stringify(p))));
    }
    await this.#run('INSERT OR IGNORE INTO settings VALUES (1, ?)', DEFAULT_SETTINGS);
  }

  async listProducts() {
    const { results } = await this.db.prepare('SELECT data FROM products ORDER BY id').all();
    return results.map(parse);
  }

  async getProduct(id) {
    return parse(await this.db.prepare('SELECT data FROM products WHERE id = ?').bind(id).first());
  }

  async nextProductId() {
    const row = await this.db.prepare('SELECT coalesce(max(id), 0) + 1 id FROM products').first();
    return row.id;
  }

  async saveProduct(product) {
    await this.#run(
      'INSERT OR REPLACE INTO products VALUES (?, ?)',
      product.id,
      JSON.stringify(product),
    );
  }

  async getSettings() {
    return parse(await this.db.prepare('SELECT data FROM settings WHERE id = 1').first());
  }

  async saveSettings(settings) {
    await this.#run('UPDATE settings SET data = ? WHERE id = 1', JSON.stringify(settings));
  }

  async findAdmin(username) {
    return this.db.prepare('SELECT * FROM admins WHERE username = ?').bind(username).first();
  }

  async replaceAdmin(username, salt, hash) {
    await this.db.batch([
      this.db.prepare('DELETE FROM admins'),
      this.db.prepare('INSERT INTO admins VALUES (?, ?, ?)').bind(username, salt, hash),
      this.db.prepare('DELETE FROM sessions'),
    ]);
  }

  async createSession(hash, expires) {
    await this.#run('INSERT INTO sessions VALUES (?, ?)', hash, expires);
  }

  async findSession(hash, now) {
    const row = await this.db
      .prepare('SELECT hash FROM sessions WHERE hash = ? AND expires > ?')
      .bind(hash, now)
      .first();
    return Boolean(row);
  }

  async removeSession(hash) {
    await this.#run('DELETE FROM sessions WHERE hash = ?', hash);
  }

  async purgeSessions(now) {
    await this.db.batch([
      this.db.prepare('DELETE FROM sessions WHERE expires < ?').bind(now),
      this.db.prepare('DELETE FROM rate_limits WHERE until < ?').bind(now),
    ]);
  }

  async addOrder(id, created, status, data) {
    await this.#run(
      'INSERT INTO orders VALUES (?, ?, ?, ?)',
      id,
      created,
      status,
      JSON.stringify(data),
    );
  }

  async listOrders() {
    const { results } = await this.db.prepare('SELECT * FROM orders ORDER BY created DESC').all();
    return results.map(parseRecord);
  }

  async setOrderStatus(id, status) {
    const result = await this.#run('UPDATE orders SET status = ? WHERE id = ?', status, id);
    return result.meta.changes > 0;
  }

  async addLead(id, created, data) {
    await this.#run('INSERT INTO leads VALUES (?, ?, ?)', id, created, JSON.stringify(data));
  }

  async listLeads() {
    const { results } = await this.db.prepare('SELECT * FROM leads ORDER BY created DESC').all();
    return results.map(parseRecord);
  }

  async addClaim(id, created, data) {
    await this.#run('INSERT INTO claims VALUES (?, ?, ?)', id, created, JSON.stringify(data));
  }

  async listClaims() {
    const { results } = await this.db.prepare('SELECT * FROM claims ORDER BY created DESC').all();
    return results.map(parseRecord);
  }

  async hitRateLimit(key, now, windowMs) {
    const until = now + windowMs;
    const row = await this.db.prepare(RATE_LIMIT_SQL).bind(key, until, now, now, until).first();
    return row.n;
  }
}
