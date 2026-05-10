# Character-Centric Redesign — Process Plan

**Spec:** `docs/superpowers/specs/2026-05-10-character-centric-redesign.md`
**Date:** 2026-05-10
**Type:** Brownfield full-stack migration

---

## Goal

Merge `influencer_profiles` into `characters`. Make character the single hub for all work. Remove the `personas` API module. Update campaigns, generations, and gallery to use `characterId`. Rebuild character detail page as a 4-tab workspace hub.

## Current State (pre-migration)

| Area | Status |
|------|--------|
| `apps/api/src/db/schema.ts` | ✅ Already updated — persona fields on `characters`, `characterId` on `contentCampaigns`, no `influencer_profiles` |
| `packages/shared/src/schemas/character.ts` | ❌ Minimal — missing all persona fields |
| `packages/shared/src/schemas/campaign.ts` | ❌ Still uses `influencerProfileId` |
| `packages/shared/src/schemas/generation.ts` | ❌ Still has `influencerProfileId` field |
| `packages/shared/src/schemas/persona.ts` | ❌ Exists — must be deleted |
| `apps/api/src/modules/personas/` | ❌ Still exists — must be deleted |
| `apps/api/src/app.ts` | ❌ Still registers personas router |
| `apps/api/src/modules/campaigns/` | ❌ Still validates `influencerProfileId`, queries `influencerProfiles` table |
| `apps/api/src/modules/generations/` | ❌ May still reference influencer profile |
| `apps/api/src/modules/gallery/` | ❌ May have `personaId` filter |
| `apps/web/app/composables/usePersonas.ts` | ❌ Exists — must be deleted |
| `apps/web/app/composables/useCampaigns.ts` | ❌ May use `influencerProfileId` |
| `apps/web/app/composables/useGenerations.ts` | ❌ Sends `influencerProfileId` in create payload |
| Sidebar navigation | ❌ Has Campanhas top-level item |
| `pages/index.vue` (dashboard) | ❌ Not character-centric |
| `pages/characters/[id].vue` | ❌ Not a 4-tab hub |
| `pages/generate.vue` | ❌ Character selector is optional |
| Campaign forms | ❌ Use `influencerProfileId` |

---

## Phases

### Phase 1 — Shared Schemas (agent)

Update `@lumora/shared` package:
- `character.ts`: Add all 13 persona fields as optional to `createCharacterSchema` and `updateCharacterSchema`
- `campaign.ts`: `influencerProfileId` → `characterId` (required uuid)
- `generation.ts`: Remove `influencerProfileId` field
- `persona.ts`: Delete
- `index.ts`: Remove persona export

### Phase 2 — Backend API (agent)

- `app.ts`: Remove personas router import and registration
- `modules/personas/`: Delete entire directory
- `modules/campaigns/campaign.repository.ts`: Replace `influencerProfiles` import with `characters`, replace `personaBelongsToWorkspace` with `characterBelongsToWorkspace`
- `modules/campaigns/campaign.routes.ts`: Use `characterId` instead of `influencerProfileId`
- `modules/generations/`: Remove `influencerProfileId`, read persona from `character` row
- `modules/gallery/`: Remove `personaId` filter
- `modules/characters/`: Ensure GET/PUT serve all persona fields inline
- `worker.ts`: Remove `influencer_profiles` join

### Phase 3 — DB Migration (shell + breakpoint)

1. `pnpm db:generate` — Drizzle diffs the schema against the DB, generates SQL
2. **BREAKPOINT** — User reviews migration SQL (required: `alwaysBreakOn: database-migration`)
3. `pnpm db:migrate` — Applies migration (destructive but safe: scaffold phase, no prod data)

### Phase 4 — Frontend (agent)

- Delete `usePersonas.ts`
- Update `useCampaigns.ts` — `characterId` filter and create param
- Update `useGenerations.ts` — remove `influencerProfileId` from create payload
- Sidebar: Remove Campanhas from top-level nav
- `pages/index.vue`: Character cards grid (name, photo, campaign count, pending approvals, last generation) + secondary usage/cost
- `pages/characters/[id].vue`: 4-tab hub (Identidade / Campanhas / Galeria / Gerar)
- `pages/generate.vue`: Character selector required
- Campaign forms: `characterId` pre-filled from context

### Phase 5 — Quality Gate (shell + agent fix loops)

- `pnpm typecheck` → if errors: agent fix loop → re-check
- `pnpm test` → if failures: agent fix loop → re-run
- Final human breakpoint for sign-off

---

## Breakpoints

| Breakpoint | Why |
|-----------|-----|
| DB migration review | `alwaysBreakOn: database-migration` — destructive, non-reversible |
| Final review | Sign-off on completed migration |

## Agents Used

| Agent | Task |
|-------|------|
| `general-purpose` | Shared schemas, backend API, frontend, fix loops |
| Shell | `pnpm db:generate`, `pnpm db:migrate`, `pnpm typecheck`, `pnpm test` |

## Verification (from spec)

After completion:
- `pnpm typecheck` — all packages green
- `pnpm test` — all 109 tests pass
- Create character with persona fields — data persists
- Create campaign linked to character — appears in Campanhas tab
- Generate from Gerar tab — polls to completion
- Dashboard shows character cards with stats
- `GET /personas/anything` → 404
