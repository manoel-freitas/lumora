# AGENTS.md

## What

Lumora — AI influencer content studio. SFW v1. Manual export only. See `SPEC.md` for full product spec.

## Monorepo

- `apps/web` — Nuxt 4, Vue 3, Tailwind, Pinia
- `apps/api` — Hono, Drizzle ORM, PostgreSQL, BullMQ, Redis, R2
- `packages/shared` — Zod schemas and types

## Agent Rules

On every execution:

1. **TDD** — failing test first → implement → refactor. Red-green-refactor.
2. **YAGNI** — build current slice only. No future abstractions, integrations, or modes.
3. **KISS** — plain functions, small modules, explicit validation. No clever patterns.
4. **Safety** — enforce moderation, auth, workspace isolation, no secrets in code.
5. **Read SPEC.md** before product or architecture changes.

## v1 Boundaries (do not cross)

- No social OAuth, auto-posting, Postiz, Ayrshare.
- No adult/private content unless `ENABLE_ADULT_MODE=true` + workspace adult mode + strict age/consent/audit gates.
- No direct social publishing. Manual export packages only.
- Deny-by-default for moderation and adult workflows.

## Commands

```bash
pnpm install && cp .env.example .env   # setup
pnpm dev                                # run all
pnpm test                               # all tests (vitest)
pnpm typecheck                          # all typechecks
pnpm build                              # build all
```

Per-package: `pnpm --filter @lumora/api test`, etc.

DB: `pnpm db:generate` · `pnpm db:migrate` · `pnpm db:seed`

## Testing

- Runner: **vitest**. Test files: `foo.ts` → `foo.test.ts`.
- Pure functions → unit. Hono routes → `app.request()` integration. No test DB.
- Verify before done: `pnpm test && pnpm typecheck`

## Code Style

- TypeScript strict. Shared Zod schemas for cross-package contracts.
- Backend: `src/modules/<domain>` with route → service → repository. Keep handlers thin.
- Frontend: `<script setup lang="ts">`, composables for API, Tailwind OK.
- No speculative abstractions. Clear names over comments.
