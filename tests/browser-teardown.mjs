import { readFileSync } from 'node:fs';
export default async function () {
  try {
    const pid = Number(readFileSync('test-results/browser-server.pid', 'utf8'));
    if (Number.isInteger(pid) && pid > 0) process.kill(pid);
  } catch {
    // El servidor ya había terminado.
  }
}
