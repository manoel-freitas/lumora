# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Lumora — AI influencer content studio. SFW v1. Virtual influencer creation, content generation, approval, and manual export. See `SPEC.md` for full product spec and `AGENTS.md` for agent rules.

## Commands

```bash
pnpm install && cp .env.example .env   # first-time setup
pnpm dev                                # run all services
pnpm test                               # all tests (vitest)
pnpm typecheck                          # all typechecks
pnpm build                              # build all

# Per-package
pnpm --filter @lumora/api test
pnpm --filter @lumora/web test
pnpm --filter @lumora/shared test

# Single test file
pnpm --filter @lumora/api exec vitest run src/modules/storage/storage.service.test.ts

# Database
pnpm db:generate    # generate migration from schema
pnpm db:migrate     # run migrations
pnpm db:seed        # seed default prompt templates
pnpm db:studio      # drizzle studio UI
```

## Architecture

pnpm workspaces + Turborepo monorepo:

- `apps/api` — Hono backend on Node, port 3001
- `apps/web` — Nuxt 4 frontend, port 3000
- `packages/shared` — shared Zod schemas and TypeScript types

**Critical data flow:** Browser → `/api/*` → Nuxt Nitro proxy (`apps/web/server/api/[...].ts`) → Hono API. The Hono API URL must never be exposed to the browser.

### API structure

Backend modules live in `apps/api/src/modules/<domain>/` with three layers:
- `*.routes.ts` — thin Hono handlers, Zod validation via `@hono/zod-validator`
- `*.service.ts` — business logic
- `*.repository.ts` — Drizzle ORM queries

All queries are scoped by `workspaceId`. Every protected route requires auth middleware from `apps/api/src/infra/auth.ts`.

Infra singletons:
- `src/infra/db.ts` — Drizzle + pg Pool
- `src/infra/r2.ts` — Cloudflare R2 (S3-compatible)
- `src/infra/queue.ts` — BullMQ + IORedis

### Generation flow

1. `POST /generations` → service validates quota/adult-mode rules → persists as `queued` → enqueues BullMQ job
2. `apps/api/worker.ts` (separate Railway service) — pulls job → calls Together AI or fal.ai → uploads to R2 → runs moderation → creates `contentAsset` → records cost
3. Frontend polls `GET /generations/:id` until terminal status

AI providers: `src/modules/ai/image/providers/together-image.provider.ts` and `src/modules/ai/image/providers/fal.provider.ts`.

### Frontend structure

- `apps/web/app/pages/` — route pages
- `apps/web/app/components/` — UI components grouped by domain
- `apps/web/app/composables/` — typed API client functions using `$fetch('/api/*')`

### Shared schemas

`packages/shared/src/schemas/` contains Zod schemas used as cross-package contracts. Always import from `@lumora/shared`.

## Key constraints

- Adult content blocked unless `ENABLE_ADULT_MODE=true` + workspace `adultModeEnabled=true`
- Adult content blocked for `instagram`/`tiktok` platforms always
- Private media uses signed R2 URLs (15-min expiry); never public R2 paths for adult content
- Use `idempotencyKey` to prevent duplicate generation jobs
- All Drizzle queries use parameterized inputs — no raw SQL with user input

## Testing conventions

- Test runner: **vitest**. Test file: `foo.ts` → `foo.test.ts` in same directory
- Pure functions → unit tests. Hono routes → integration tests via `app.request()`
- No test database — mock infra dependencies
- Verify before done: `pnpm test && pnpm typecheck`

Current coverage: 109 tests across `@lumora/api`, `@lumora/web`, and `@lumora/shared`.

## v1 boundaries (do not cross)

- No social OAuth, auto-posting, Postiz, or Ayrshare
- No direct social publishing — manual export packages only
- No explicit adult content without feature flag + workspace setting
