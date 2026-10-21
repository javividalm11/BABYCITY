// Genero una copia consistente de la base de datos local en backups/.
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const source = process.env.DB_PATH || path.resolve('data/babycity.sqlite');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const target = path.resolve('backups', `babycity-${stamp}.sqlite`);

mkdirSync(path.dirname(target), { recursive: true });
const db = new DatabaseSync(source);
db.exec(`VACUUM INTO '${target.replaceAll("'", "''")}'`);
db.close();
console.log(target);
