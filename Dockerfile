FROM node:24-alpine
WORKDIR /app

COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src
COPY --chown=node:node public ./public
COPY --chown=node:node catalogo ./catalogo
COPY --chown=node:node data/products.json ./data/products.json
COPY --chown=node:node scripts/backup.mjs ./scripts/backup.mjs

RUN mkdir -p /app/data/uploads /app/backups && chown -R node:node /app/data /app/backups

ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 TRUST_PROXY=true
USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/settings" > /dev/null || exit 1

CMD ["node", "src/adapters/node/main.js"]
