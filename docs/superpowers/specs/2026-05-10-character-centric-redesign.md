# Character-Centric Redesign — Design Spec

**Date:** 2026-05-10
**Status:** Approved

---

## Context

Lumora's current model separates `characters` (visual identity) from `influencer_profiles` (persona/social identity). Campaigns link to `influencerProfileId`, generations optionally link to both. This creates two overlapping concepts for what is conceptually one entity: the AI influencer character.

The redesign merges influencer persona fields into the character entity and makes the character the single hub for all work — campaigns, generations, content, approvals. The UI becomes character-first: users always enter through a character to do any work.

**Goal:** One entity, one hub. Simpler model, simpler navigation, clearer mental model for the user.

---

## Approach

Merge influencer profile fields into the `characters` table. Remove the `influencer_profiles` table. Update all FK references from `influencerProfileId` to `characterId`. Rebuild the character detail page as the main workspace hub with tabs.

---

## Data Model Changes

### `characters` table — adds persona fields

New columns (all optional):

| Column | Type | Description |
|--------|------|-------------|
| `display_name` | varchar(255) | Public influencer name |
| `niche` | varchar(255) | Content niche |
| `audience` | text | Target audience description |
| `backstory` | text | Character backstory |
| `personality_traits` | jsonb (string[]) | List of traits |
| `tone_of_voice` | text | Communication style |
| `languages` | jsonb (string[]) | List of language codes |
| `content_pillars` | jsonb (string[]) | Content topic categories |
| `visual_style` | text | Visual aesthetic description |
| `boundaries` | text | Content boundaries |
| `sfw_policy` | text | SFW content rules |
| `nsfw_policy` | text | NSFW content rules |
| `disclosure_note` | text | AI disclosure disclaimer |

### `influencer_profiles` table — removed

New Drizzle migration drops this table after migrating any existing data.

### `content_campaigns` table

- `influencer_profile_id` column removed
- `character_id` column added (FK to `characters.id`, not null, cascade delete)

### `generations` table

- `influencer_profile_id` column removed
- `character_id` column already exists — kept, made the primary association

---

## API Changes

### `characters` module

- `CreateCharacterSchema` and `UpdateCharacterSchema` in `@lumora/shared` gain all persona fields (optional in create, partial in update).
- `findById` returns the full character with photos and persona fields inline — no separate persona join.
- Routes `GET /characters/:id/persona` and `PUT /characters/:id/persona` **removed**.
- Standard `GET /characters/:id` and `PUT /characters/:id` serve both visual identity and persona data.

### `personas` module — removed

- Router deregistered from `apps/api/src/index.ts`.
- Module directory deleted.
- All `/personas` routes removed from the API.

### `campaigns` module

- `CreateCampaignSchema`: `influencerProfileId` → `characterId` (required uuid).
- Repository `create()` uses `characterId`.
- `GET /campaigns` supports `?characterId=` filter.

### `generations` module

- `CreateGenerationSchema`: `influencerProfileId` field removed.
- Service resolves persona context from `character` record directly (`character.niche`, `character.personalityTraits`, etc.).
- Worker updated: removes join to `influencer_profiles`, reads persona from character row.

### `gallery` module

- `personaId` filter removed.
- `characterId` filter kept.

### `@lumora/shared` schemas

| File | Change |
|------|--------|
| `character.ts` | Add all persona fields to create/update schemas |
| `persona.ts` | Deleted |
| `campaign.ts` | `influencerProfileId` → `characterId` |
| `generation.ts` | Remove `influencerProfileId` |

---

## Frontend Changes

### Navigation

Remove "Campanhas" from the top-level sidebar. Navigation:
- Dashboard
- Personagens
- Galeria
- Aprovações
- Calendário

Campaigns are accessed via the character detail page only.

### Dashboard (`pages/index.vue`)

- Primary content: character cards grid.
- Each card shows: name, photo, active campaign count, pending approvals, last generation.
- Secondary: monthly usage/cost.

### Character Detail (`pages/characters/[id].vue`) — main hub

Four tabs:

1. **Identidade** — Single form with visual fields (name, description, trigger word) + persona fields (display name, niche, audience, backstory, personality traits, tone of voice, languages, content pillars, visual style, boundaries, SFW/NSFW policies, disclosure note). Reference photo grid below.
2. **Campanhas** — Campaign list filtered to this character. "Nova Campanha" button pre-fills `characterId`.
3. **Galeria** — Gallery filtered to this character. Shows all completed generations.
4. **Gerar** — Inline generation form pre-filled with this character.

### Generate page (`pages/generate.vue`)

- Character selector becomes required (not optional).
- On select, persona fields auto-fill from character data.

### Campaigns

- `pages/campaigns/index.vue` and `pages/campaigns/new.vue` — kept but no longer in sidebar. Accessible via character detail "Campanhas" tab.
- `CampaignForm.vue` — `influencerProfileId` selector replaced by `characterId` (pre-filled from context when opened from character detail).

### Composables

- `usePersonas.ts` — deleted.
- `useCharacters.ts` — absorbs persona get/update (calls `GET /characters/:id` and `PUT /characters/:id`).
- `useCampaigns.ts` — `influencerProfileId` param replaced by `characterId`.
- `useGenerations.ts` — removes `influencerProfileId` from create payload.

---

## Migration Strategy

1. Generate new Drizzle migration: `pnpm db:generate`
2. Migration adds persona columns to `characters`.
3. Migration adds `character_id` to `content_campaigns`, drops `influencer_profile_id`.
4. Migration drops `influencer_profiles` table.
5. Migration removes `influencer_profile_id` from `generations`.
6. Run: `pnpm db:migrate`

Since the project is in scaffold phase with no production data, a destructive migration is safe.

---

## Verification

After implementation:

```bash
pnpm db:generate        # new migration appears
pnpm db:migrate         # migration runs without error
pnpm typecheck          # all packages green
pnpm test               # all 109 tests pass (some may update)
pnpm dev                # app starts, no runtime errors
```

Manual checks:
- Create a character with persona fields — data persists.
- Create a campaign linked to the character — appears in character detail "Campanhas" tab.
- Generate an image from character detail "Gerar" tab — polls to completion.
- Dashboard shows character cards with stats.
- No `/personas` endpoint responds (404 expected).
