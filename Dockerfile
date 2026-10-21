FROM node:24-alpine
WORKDIR /app
COPY --chown=node:node package.json server.mjs ./
COPY --chown=node:node public ./public
COPY --chown=node:node catalogo ./catalogo
COPY --chown=node:node data/products.json ./data/products.json
COPY --chown=node:node scripts/setup-admin.mjs scripts/backup.mjs ./scripts/
RUN mkdir -p /app/public/assets/uploads /app/backups /app/data && chown -R node:node /app/data /app/public/assets/uploads /app/backups
ENV HOST=0.0.0.0 PORT=3000 COOKIE_SECURE=true
USER node
EXPOSE 3000
CMD ["node", "server.mjs"]
