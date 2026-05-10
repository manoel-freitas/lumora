# Task: Docker Compose + Images for Local Development

## Goals
- [x] Create `docker-compose.yml` — full stack (postgres, redis, api, worker, web)
- [x] Create `docker-compose.infra.yml` — infra only (postgres + redis)
- [x] Create `apps/api/Dockerfile` — dev + prod multi-stage
- [x] Create `apps/web/Dockerfile` — dev + prod multi-stage
- [x] Create `.dockerignore` at monorepo root
- [x] Update `README.md` with Docker setup instructions

## Checklist
- [x] `docker-compose.yml` — valid config, healthchecks, hot-reload volumes
- [x] `docker-compose.infra.yml` — infra-only shortcut
- [x] `apps/api/Dockerfile` — base/deps/dev/build/prod stages, pnpm monorepo aware
- [x] `apps/web/Dockerfile` — base/deps/dev/build/prod stages, Nuxt host binding
- [x] `.dockerignore` — excludes node_modules, dist, .nuxt, .env, .git
- [x] README — Option A (local + docker infra) and Option B (full docker compose)

## Files Created
- `docker-compose.yml`
- `docker-compose.infra.yml`
- `apps/api/Dockerfile`
- `apps/web/Dockerfile`
- `.dockerignore`
- `README.md` (updated Getting Started section)

## Notes
- DB/Redis default credentials in compose: `lumora/lumora/lumora`
- `.env.example` DATABASE_URL and REDIS_URL already match localhost defaults
- Devs using Option A just run `docker compose -f docker-compose.infra.yml up -d` then `pnpm dev`
- Hot-reload via bind mounts: `apps/api/src`, `apps/web`, `packages/shared/src`
- Worker service runs `pnpm dev:worker` in same api image
- External APIs (Together AI, fal.ai, R2) require real keys — no local mocks in scope
- COMPLETE ✓
