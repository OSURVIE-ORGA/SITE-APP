# syntax=docker/dockerfile:1

# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

# ---------- runtime ----------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Non-root. `uploads` is created and owned by `node` so the reaper can write.
RUN mkdir -p /app/uploads && chown -R node:node /app
USER node

COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/package.json ./package.json

EXPOSE 3000

# Compose also defines a healthcheck; this one keeps `docker run` honest too.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main"]
