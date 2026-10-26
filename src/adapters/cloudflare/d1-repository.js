import {
  AUDIT_RETENTION_MS,
  DEFAULT_SETTINGS,
  HANDLED_SQL,
  HANDLED_TABLES,
  parseRecord,
  RATE_LIMIT_SQL,
  REVIEW_PAYMENT_SQL,
  SCHEMA,
  TOUCH_SESSION_SQL,
} from '../schema.js';

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

  async #all(sql, ...values) {
    const { results } = await this.db
      .prepare(sql)
      .bind(...values)
      .all();
    return results;
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
    return (await this.#all('SELECT data FROM products ORDER BY id')).map(parse);
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

  async deleteProduct(id) {
    return (await this.#run('DELETE FROM products WHERE id = ?', id)).meta.changes > 0;
  }

  async getSettings() {
    return parse(await this.db.prepare('SELECT data FROM settings WHERE id = 1').first());
  }

  async saveSettings(settings) {
    await this.#run('UPDATE settings SET data = ? WHERE id = 1', JSON.stringify(settings));
  }

  async findAdmin(username) {
    return this.db
      .prepare('SELECT * FROM admin_accounts WHERE username = ?')
      .bind(username)
      .first();
  }

  async getAdminAccount() {
    return this.db.prepare('SELECT * FROM admin_accounts LIMIT 1').first();
  }

  async replaceAdmin(username, salt, hash, envSeed) {
    await this.db.batch([
      this.db.prepare('DELETE FROM admin_accounts'),
      this.db
        .prepare('INSERT INTO admin_accounts VALUES (?, ?, ?, ?)')
        .bind(username, salt, hash, envSeed),
      this.db.prepare('DELETE FROM admin_sessions'),
    ]);
  }

  // Cambio la clave y cierro las demás sesiones; la actual se conserva.
  async updatePassword(username, salt, hash, keepHash) {
    await this.db.batch([
      this.db
        .prepare('UPDATE admin_accounts SET salt = ?, hash = ? WHERE username = ?')
        .bind(salt, hash, username),
      this.db
        .prepare('DELETE FROM admin_sessions WHERE username = ? AND hash != ?')
        .bind(username, keepHash),
    ]);
  }

  async removeOtherSessions(username, keepHash) {
    const result = await this.#run(
      'DELETE FROM admin_sessions WHERE username = ? AND hash != ?',
      username,
      keepHash,
    );
    return result.meta.changes;
  }

  async createSession(hash, username, idleExpires, absoluteExpires) {
    await this.#run(
      'INSERT INTO admin_sessions VALUES (?, ?, ?, ?)',
      hash,
      username,
      idleExpires,
      absoluteExpires,
    );
  }

  async touchSession(hash, now, idleMs) {
    const row = await this.db
      .prepare(TOUCH_SESSION_SQL)
      .bind(now + idleMs, hash, now, now)
      .first();
    return row ? { username: row.username } : null;
  }

  async removeSession(hash) {
    await this.#run('DELETE FROM admin_sessions WHERE hash = ?', hash);
  }

  async purgeExpired(now) {
    const limit = new Date(now - AUDIT_RETENTION_MS).toISOString();
    await this.db.batch([
      this.db
        .prepare('DELETE FROM admin_sessions WHERE idle_expires < ? OR absolute_expires < ?')
        .bind(now, now),
      this.db.prepare('DELETE FROM rate_limits WHERE until < ?').bind(now),
      this.db.prepare('DELETE FROM audit_log WHERE at < ?').bind(limit),
    ]);
  }

  async addOrder(id, created, status, data, receipt = null) {
    const statements = [
      this.db
        .prepare('INSERT INTO orders VALUES (?, ?, ?, ?)')
        .bind(id, created, status, JSON.stringify(data)),
    ];
    if (receipt)
      statements.push(
        this.db
          .prepare('INSERT INTO order_receipts VALUES (?, ?, ?)')
          .bind(id, receipt.contentType, receipt.base64),
      );
    await this.db.batch(statements);
  }

  async getOrderReceipt(id) {
    return this.db
      .prepare('SELECT content_type, base64 FROM order_receipts WHERE order_id = ?')
      .bind(id)
      .first();
  }

  async reviewPayment(id, status, username, at) {
    const row = await this.db.prepare(REVIEW_PAYMENT_SQL).bind(status, username, at, id).first();
    return row ? JSON.parse(row.data).payment : null;
  }

  async listOrders() {
    return (await this.#all('SELECT * FROM orders ORDER BY created DESC')).map(parseRecord);
  }

  async setOrderStatus(id, status) {
    const result = await this.#run('UPDATE orders SET status = ? WHERE id = ?', status, id);
    return result.meta.changes > 0;
  }

  async deleteOrder(id) {
    return (await this.#run('DELETE FROM orders WHERE id = ?', id)).meta.changes > 0;
  }

  async setOrderNote(id, note) {
    const sql = "UPDATE orders SET data = json_set(data, '$.internalNote', ?) WHERE id = ?";
    return (await this.#run(sql, note, id)).meta.changes > 0;
  }

  async addLead(id, created, data) {
    await this.#run('INSERT INTO leads VALUES (?, ?, ?)', id, created, JSON.stringify(data));
  }

  async listLeads() {
    return (await this.#all('SELECT * FROM leads ORDER BY created DESC')).map(parseRecord);
  }

  async addClaim(id, created, data) {
    await this.#run('INSERT INTO claims VALUES (?, ?, ?)', id, created, JSON.stringify(data));
  }

  async listClaims() {
    return (await this.#all('SELECT * FROM claims ORDER BY created DESC')).map(parseRecord);
  }

  async setHandled(kind, id, handled, at) {
    const table = HANDLED_TABLES[kind];
    if (!table) throw new Error('Tipo de registro no permitido');
    return (await this.#run(HANDLED_SQL(table), String(handled), at, id)).meta.changes > 0;
  }

  async hitRateLimit(key, now, windowMs) {
    const until = now + windowMs;
    const row = await this.db.prepare(RATE_LIMIT_SQL).bind(key, until, now, now, until).first();
    return row.n;
  }

  async addAudit(at, actor, action, target, detail) {
    await this.#run(
      'INSERT INTO audit_log(at, actor, action, target, detail) VALUES (?, ?, ?, ?, ?)',
      at,
      actor,
      action,
      target,
      detail,
    );
  }

  async listAudit(limit) {
    return this.#all('SELECT * FROM audit_log ORDER BY id DESC LIMIT ?', limit);
  }
}
