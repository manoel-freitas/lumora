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
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

# ── Dev (Nuxt dev server) ─────────────────────────────────────────
FROM deps AS dev
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
WORKDIR /app/apps/web
ENV NODE_ENV=development
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000
EXPOSE 3000
CMD ["pnpm", "dev", "--host"]

# ── Build ─────────────────────────────────────────────────────────
FROM deps AS build
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
ARG NUXT_PUBLIC_API_URL=http://localhost:3001
ENV NUXT_PUBLIC_API_URL=${NUXT_PUBLIC_API_URL}
RUN pnpm --filter @lumora/shared build 2>/dev/null || true
RUN pnpm --filter @lumora/web build

# ── Production ────────────────────────────────────────────────────
FROM node:22-alpine AS prod
RUN npm install -g pnpm@latest
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile --prod
COPY --from=build /app/apps/web/.output ./apps/web/.output
COPY --from=build /app/packages/shared/dist ./packages/shared/dist 2>/dev/null || true
WORKDIR /app/apps/web
ENV NODE_ENV=production
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
