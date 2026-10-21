import {db} from '../server.mjs';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
mkdirSync('backups',{recursive:true});
const file=path.resolve('backups',`babycity-${new Date().toISOString().replace(/[:.]/g,'-')}.sqlite`);
db.exec(`VACUUM INTO '${file.replaceAll("'","''")}'`);db.close();console.log(file);
