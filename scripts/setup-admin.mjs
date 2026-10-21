import {randomBytes,scryptSync} from 'node:crypto';
import {db} from '../server.mjs';
const username=process.env.ADMIN_USER||'admin';
const password=process.env.ADMIN_PASSWORD;
if(!password||password.length<14){console.error('Define ADMIN_PASSWORD con un mínimo de 14 caracteres y ejecuta npm.cmd run admin:setup. No existe contraseña predeterminada.');process.exit(1);}
const salt=randomBytes(32).toString('hex');
db.prepare('INSERT OR REPLACE INTO admins VALUES (?,?,?)').run(username,salt,scryptSync(password,salt,64).toString('hex'));
db.exec('DELETE FROM sessions');db.close();console.log('Cuenta administradora configurada.');
