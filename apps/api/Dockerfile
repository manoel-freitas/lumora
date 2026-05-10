# syntax=docker/dockerfile:1
# Build context: monorepo root

# ── Base ─────────────────────────────────────────────────────────
FROM node:22-alpine AS base
RUN npm install -g pnpm@latest
WORKDIR /app

# ── Deps (cached layer) ───────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

# ── Dev (hot-reload via tsx watch) ───────────────────────────────
FROM deps AS dev
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
WORKDIR /app/apps/api
ENV NODE_ENV=development
EXPOSE 3001
CMD ["pnpm", "dev"]

# ── Build ─────────────────────────────────────────────────────────
FROM deps AS build
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN pnpm --filter @lumora/shared build 2>/dev/null || true
RUN pnpm --filter @lumora/api build

# ── Production ────────────────────────────────────────────────────
FROM node:22-alpine AS prod
RUN npm install -g pnpm@latest
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --prod
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/shared/dist ./packages/shared/dist 2>/dev/null || true
WORKDIR /app/apps/api
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/index.js"]
