import { createNodeServer } from './server.js';

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT) || 3000;
const { server, repo } = createNodeServer();

server.listen(port, host, () => console.log(`BabyCity: http://${host}:${port}`));

// Cierro el servidor y la base de datos de forma ordenada al recibir la señal de apagado.
function shutdown() {
  server.close(() => {
    repo.close();
    process.exit(0);
  });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
