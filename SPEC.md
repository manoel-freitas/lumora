# SPEC.md — Lumora AI Influencer Content Studio

> Working name: **Lumora**  
> Positioning: **AI influencer content studio for creating, planning, approving, and manually exporting consistent virtual influencer media.**  
> Stack: Nuxt 4 · Hono · TypeScript · PostgreSQL · Drizzle ORM · Cloudflare R2 · BullMQ · Redis · Together AI · fal.ai · Railway  
> Monorepo: pnpm workspaces + Turborepo

---

## 1. Product Overview

Lumora is an AI influencer content studio. Users create consistent virtual influencers, define their persona and visual identity, generate safe-for-work social media images/videos, organize content campaigns, review platform safety, and manually export ready-to-post content packages for Instagram, TikTok, X, and other channels.

The platform starts as an **SFW/suggestive-but-not-explicit** creator workflow. Future versions may support adult/private monetization workflows for platforms such as OnlyFans and Privacy, but those features must be separated behind stricter age, consent, privacy, moderation, and audit controls.

### Product Goal

The main goal is not only to generate images and videos. The goal is to generate and manage a repeatable workflow for an AI social influencer:

1. Create a consistent virtual character.
2. Define the influencer persona, niche, content pillars, tone, and visual identity.
3. Generate content ideas and campaigns.
4. Generate SFW sensual-but-platform-safe images and videos.
5. Review, approve, and organize content.
6. Prepare captions, hashtags, platform notes, and content plans.
7. Export downloadable/manual posting packages.
8. Track whether content was exported or manually posted.
9. Later, support adult/private content workflows in a separated and compliant mode.

### Core User Flows

1. **Dashboard** — Overview of campaigns, scheduled posts, recent generations, and pending approvals.
2. **Gallery** — Browse generated images/videos across all influencers and campaigns.
3. **Characters** — Create and manage character identity, reference photos, and consistency settings.
4. **Influencer Persona** — Define niche, tone of voice, backstory, audience, visual style, content pillars, and boundaries.
5. **Generate** — Pick a character/persona, platform, content rating, media type, and content template. Generate images/videos asynchronously.
6. **Campaigns** — Plan a content campaign with ideas, briefs, assets, captions, and platform targeting.
7. **Approval Queue** — Review generated media for brand fit, platform safety, and export readiness.
8. **Content Calendar** — Plan approved assets and create manual export packages for posting.
9. **Character Detail** — View reference photos, generations, campaigns, and content assets tied to a character.

---

## 2. Product Positioning

Lumora should be positioned as:

> **An AI influencer workflow platform, not only a character generator.**

Avoid positioning v1 as a direct clone of AI companion/chat platforms. Lumora is closer to a creator studio: persona design, content generation, content planning, safety review, approval, and manual export.

### Primary v1 Use Case

A creator wants to build a fictional adult AI influencer who posts SFW or suggestive-but-safe content on social platforms such as Instagram and TikTok.

### v1 Publishing Strategy

Lumora v1 uses **Manual Export Only**.

The platform should not connect to Instagram, TikTok, X, OnlyFans, Privacy, or any other social platform in v1. It should not implement OAuth, auto-posting, API publishing, Postiz, Ayrshare, or direct social integrations.

Instead, Lumora creates a downloadable package that helps the user manually post content.

Export package:

```txt
media/
  image-or-video.ext

caption.txt
hashtags.txt
platform-notes.txt
safety-checklist.txt
metadata.json
```

This keeps the MVP simple, cheaper, safer, and independent from social API approval.

### v1 Content Policy

Allowed:

- Fashion portraits
- Editorial portraits
- Fitness/lifestyle content
- Beauty/glamour photos
- Beachwear when non-explicit
- Sensual but clothed poses
- Dance/trend videos
- Travel/luxury lifestyle content
- Captions, hooks, and hashtag suggestions

Blocked:

- Nudity
- Explicit sexual acts
- Visible genitals or nipples
- Explicit focus on sexual body parts
- Pornographic framing
- Minor or ambiguous-age characters
- Deepfake/likeness of a real person without consent
- Platform-banned captions or hashtags
- Content designed to deceive people into believing a fictional AI influencer is a real person when disclosure is required

---

## 3. Monorepo Structure

```txt
lumora/
├── apps/
│   ├── web/                          # Nuxt 4 frontend
│   │   ├── app/
│   │   │   ├── pages/
│   │   │   │   ├── index.vue                  # Dashboard
│   │   │   │   ├── gallery.vue                # Media gallery
│   │   │   │   ├── calendar.vue               # Content planning calendar
│   │   │   │   ├── approvals.vue              # Approval queue
│   │   │   │   ├── campaigns/
│   │   │   │   │   ├── index.vue              # Campaign list
│   │   │   │   │   ├── new.vue                # Create campaign
│   │   │   │   │   └── [id].vue               # Campaign detail
│   │   │   │   ├── characters/
│   │   │   │   │   ├── index.vue              # Character list
│   │   │   │   │   ├── new.vue                # Create character
│   │   │   │   │   └── [id].vue               # Character detail + persona + generate
│   │   │   │   └── generate.vue               # Standalone generate page
│   │   │   ├── components/
│   │   │   │   ├── approvals/
│   │   │   │   │   ├── ApprovalCard.vue
│   │   │   │   │   └── SafetyResultPanel.vue
│   │   │   │   ├── calendar/
│   │   │   │   │   ├── CalendarGrid.vue
│   │   │   │   │   └── ScheduledPostCard.vue
│   │   │   │   ├── campaign/
│   │   │   │   │   ├── CampaignCard.vue
│   │   │   │   │   ├── CampaignForm.vue
│   │   │   │   │   ├── ContentIdeaList.vue
│   │   │   │   │   └── ContentAssetGrid.vue
│   │   │   │   ├── character/
│   │   │   │   │   ├── CharacterCard.vue
│   │   │   │   │   ├── CharacterForm.vue
│   │   │   │   │   ├── CharacterPhotoGrid.vue
│   │   │   │   │   └── InfluencerPersonaForm.vue
│   │   │   │   ├── gallery/
│   │   │   │   │   ├── GalleryGrid.vue
│   │   │   │   │   ├── GalleryItem.vue
│   │   │   │   │   └── GenerationStatusBadge.vue
│   │   │   │   ├── generation/
│   │   │   │   │   ├── GenerationForm.vue
│   │   │   │   │   ├── GenerationPoller.vue
│   │   │   │   │   ├── PromptTemplateSelector.vue
│   │   │   │   │   └── PlatformPresetSelector.vue
│   │   │   │   └── ui/
│   │   │   │       ├── AppHeader.vue
│   │   │   │       ├── FileUpload.vue
│   │   │   │       └── StatusPill.vue
│   │   │   ├── composables/
│   │   │   │   ├── useApprovals.ts
│   │   │   │   ├── useCampaigns.ts
│   │   │   │   ├── useCharacters.ts
│   │   │   │   ├── useGenerations.ts
│   │   │   │   ├── useGallery.ts
│   │   │   │   ├── usePersonas.ts
│   │   │   │   └── useScheduledPosts.ts
│   │   │   └── layouts/
│   │   │       └── default.vue
│   │   ├── server/
│   │   │   └── api/
│   │   │       └── [...].ts          # Proxy all /api/* to HONO_API_URL
│   │   ├── shared/
│   │   │   └── types.ts
│   │   ├── nuxt.config.ts
│   │   └── package.json
│   │
│   └── api/                          # Hono backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── workspaces/
│       │   │   ├── characters/
│       │   │   ├── personas/
│       │   │   ├── campaigns/
│       │   │   ├── content-ideas/
│       │   │   ├── content-assets/
│       │   │   ├── scheduled-posts/
│       │   │   ├── approvals/
│       │   │   ├── moderation/
│       │   │   ├── prompt-templates/
│       │   │   ├── gallery/
│       │   │   ├── generations/
│       │   │   ├── storage/
│       │   │   ├── usage/
│       │   │   └── ai/
│       │   ├── infra/
│       │   │   ├── db.ts
│       │   │   ├── r2.ts
│       │   │   ├── queue.ts
│       │   │   └── auth.ts
│       │   ├── db/
│       │   │   ├── schema.ts
│       │   │   └── migrations/
│       │   └── index.ts
│       ├── worker.ts
│       ├── drizzle.config.ts
│       └── package.json
│
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── schemas/
│       │   │   ├── approval.ts
│       │   │   ├── campaign.ts
│       │   │   ├── character.ts
│       │   │   ├── generation.ts
│       │   │   ├── persona.ts
│       │   │   ├── prompt-template.ts
│       │   │   └── scheduled-post.ts
│       │   └── index.ts
│       └── package.json
│
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
└── .env.example
```

---

## 4. Package Configuration

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### .npmrc

```ini
shamefully-hoist=true
strict-peer-dependencies=false
```

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".output/**", ".nuxt/**", "dist/**"]
    },
    "dev": { "cache": false, "persistent": true },
    "lint": { "outputs": [] },
    "typecheck": { "dependsOn": ["^build"] },
    "db:migrate": { "cache": false },
    "db:generate": { "cache": false }
  }
}
```

### Root package.json

```json
{
  "name": "lumora",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "db:migrate": "pnpm --filter @lumora/api db:migrate",
    "db:generate": "pnpm --filter @lumora/api db:generate",
    "db:studio": "pnpm --filter @lumora/api db:studio"
  },
  "devDependencies": {
    "turbo": "^2.x"
  }
}
```

### packages/shared/package.json

```json
{
  "name": "@lumora/shared",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "zod": "^3.x"
  }
}
```

### apps/api/package.json

```json
{
  "name": "@lumora/api",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "dev:worker": "tsx watch worker.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "start:worker": "node dist/worker.js",
    "db:migrate": "drizzle-kit migrate",
    "db:generate": "drizzle-kit generate",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "@lumora/shared": "workspace:*",
    "hono": "^4.x",
    "@hono/node-server": "^1.x",
    "hono/jwt": "^4.x",
    "drizzle-orm": "^0.x",
    "pg": "^8.x",
    "bullmq": "^5.x",
    "ioredis": "^5.x",
    "@aws-sdk/client-s3": "^3.x",
    "@aws-sdk/s3-request-presigner": "^3.x",
    "@fal-ai/client": "^1.x",
    "together-ai": "^0.x",
    "zod": "^3.x",
    "@hono/zod-validator": "^0.x",
    "uuid": "^9.x",
    "dotenv": "^16.x"
  },
  "devDependencies": {
    "tsx": "^4.x",
    "typescript": "^5.x",
    "drizzle-kit": "^0.x",
    "@types/pg": "^8.x",
    "@types/uuid": "^9.x"
  }
}
```

### apps/web/package.json

```json
{
  "name": "@lumora/web",
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "generate": "nuxt generate",
    "preview": "nuxt preview"
  },
  "dependencies": {
    "@lumora/shared": "workspace:*",
    "nuxt": "^4.x",
    "@nuxtjs/tailwindcss": "^6.x",
    "pinia": "^2.x",
    "@pinia/nuxt": "^0.x"
  }
}
```

---

## 5. Environment Variables

### .env.example

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/lumora

# Redis
REDIS_URL=redis://localhost:6379

# Together AI
TOGETHER_AI_API_KEY=

# fal.ai
FAL_KEY=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=lumora
R2_PUBLIC_URL=https://pub-xxxx.r2.dev
R2_PRIVATE_BUCKET_NAME=lumora-private

# Auth
JWT_SECRET=
AUTH_COOKIE_NAME=lumora_session

# App
API_PORT=3001
API_URL=http://localhost:3001
WEB_URL=http://localhost:3000
HONO_API_URL=http://localhost:3001

# Feature flags
ENABLE_ADULT_MODE=false
ENABLE_SOCIAL_INTEGRATIONS=false
```

---

## 6. Database Schema

File: `apps/api/src/db/schema.ts`

```typescript
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
  pgEnum,
  decimal,
  uniqueIndex
} from 'drizzle-orm/pg-core'

export const generationTypeEnum = pgEnum('generation_type', ['image', 'video'])
export const generationStatusEnum = pgEnum('generation_status', [
  'queued',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'expired',
  'moderation_failed'
])

export const providerEnum = pgEnum('provider', ['together_ai', 'fal_ai'])
export const contentRatingEnum = pgEnum('content_rating', ['sfw', 'suggestive', 'adult'])
export const platformEnum = pgEnum('platform', ['instagram', 'tiktok', 'x', 'youtube_shorts', 'onlyfans', 'privacy', 'other'])
export const assetStatusEnum = pgEnum('asset_status', ['generated', 'reviewed', 'approved', 'rejected', 'scheduled', 'published'])
export const campaignStatusEnum = pgEnum('campaign_status', ['draft', 'active', 'paused', 'archived'])
export const contentPlanStatusEnum = pgEnum('content_plan_status', ['draft', 'approved', 'exported', 'manually_posted', 'cancelled'])
export const exportPackageStatusEnum = pgEnum('export_package_status', ['ready', 'downloaded', 'archived'])
export const moderationRatingEnum = pgEnum('moderation_rating', ['safe', 'borderline', 'rejected'])
export const workspaceRoleEnum = pgEnum('workspace_role', ['owner', 'admin', 'member', 'viewer'])

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  adultModeEnabled: boolean('adult_mode_enabled').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const workspaceMembers = pgTable('workspace_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: workspaceRoleEnum('role').default('member').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  workspaceUserUnique: uniqueIndex('workspace_user_unique').on(table.workspaceId, table.userId),
}))

export const characters = pgTable('characters', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  triggerWord: varchar('trigger_word', { length: 100 }),
  isAdult: boolean('is_adult').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const influencerProfiles = pgTable('influencer_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  characterId: uuid('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  niche: varchar('niche', { length: 255 }),
  audience: text('audience'),
  backstory: text('backstory'),
  personalityTraits: jsonb('personality_traits').$type<string[]>(),
  toneOfVoice: text('tone_of_voice'),
  languages: jsonb('languages').$type<string[]>(),
  contentPillars: jsonb('content_pillars').$type<string[]>(),
  visualStyle: text('visual_style'),
  boundaries: text('boundaries'),
  sfwPolicy: text('sfw_policy'),
  nsfwPolicy: text('nsfw_policy'),
  disclosureNote: text('disclosure_note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const characterPhotos = pgTable('character_photos', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  characterId: uuid('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  r2Key: varchar('r2_key', { length: 500 }).notNull(),
  bucket: varchar('bucket', { length: 255 }),
  url: varchar('url', { length: 1000 }),
  visibility: varchar('visibility', { length: 50 }).default('private').notNull(),
  contentType: varchar('content_type', { length: 100 }),
  sizeBytes: integer('size_bytes'),
  checksum: varchar('checksum', { length: 255 }),
  isPrimary: boolean('is_primary').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const promptTemplates = pgTable('prompt_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  platform: platformEnum('platform').notNull(),
  contentRating: contentRatingEnum('content_rating').default('sfw').notNull(),
  mediaType: generationTypeEnum('media_type').notNull(),
  template: text('template').notNull(),
  negativePrompt: text('negative_prompt'),
  variables: jsonb('variables').$type<string[]>(),
  isSystem: boolean('is_system').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const contentCampaigns = pgTable('content_campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  influencerProfileId: uuid('influencer_profile_id').notNull().references(() => influencerProfiles.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  goal: varchar('goal', { length: 255 }),
  platform: platformEnum('platform').notNull(),
  contentRating: contentRatingEnum('content_rating').default('sfw').notNull(),
  status: campaignStatusEnum('status').default('draft').notNull(),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const contentIdeas = pgTable('content_ideas', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  campaignId: uuid('campaign_id').notNull().references(() => contentCampaigns.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  hook: text('hook'),
  captionDraft: text('caption_draft'),
  hashtags: jsonb('hashtags').$type<string[]>(),
  platform: platformEnum('platform').notNull(),
  status: varchar('status', { length: 50 }).default('idea').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const generations = pgTable('generations', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  characterId: uuid('character_id').references(() => characters.id, { onDelete: 'set null' }),
  influencerProfileId: uuid('influencer_profile_id').references(() => influencerProfiles.id, { onDelete: 'set null' }),
  campaignId: uuid('campaign_id').references(() => contentCampaigns.id, { onDelete: 'set null' }),
  promptTemplateId: uuid('prompt_template_id').references(() => promptTemplates.id, { onDelete: 'set null' }),
  type: generationTypeEnum('type').notNull(),
  platform: platformEnum('platform').default('instagram').notNull(),
  contentRating: contentRatingEnum('content_rating').default('sfw').notNull(),
  prompt: text('prompt').notNull(),
  finalPrompt: text('final_prompt'),
  negativePrompt: text('negative_prompt'),
  status: generationStatusEnum('status').default('queued').notNull(),
  r2Key: varchar('r2_key', { length: 500 }),
  bucket: varchar('bucket', { length: 255 }),
  url: varchar('url', { length: 1000 }),
  visibility: varchar('visibility', { length: 50 }).default('private').notNull(),
  width: integer('width'),
  height: integer('height'),
  duration: integer('duration'),
  provider: providerEnum('provider'),
  model: varchar('model', { length: 100 }),
  modelVersion: varchar('model_version', { length: 100 }),
  referencePhotoUrl: varchar('reference_photo_url', { length: 1000 }),
  generationSettings: jsonb('generation_settings'),
  metadata: jsonb('metadata'),
  error: text('error'),
  idempotencyKey: varchar('idempotency_key', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const contentAssets = pgTable('content_assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  campaignId: uuid('campaign_id').references(() => contentCampaigns.id, { onDelete: 'set null' }),
  generationId: uuid('generation_id').references(() => generations.id, { onDelete: 'cascade' }),
  assetType: varchar('asset_type', { length: 50 }).notNull(),
  platform: platformEnum('platform').notNull(),
  contentRating: contentRatingEnum('content_rating').default('sfw').notNull(),
  status: assetStatusEnum('status').default('generated').notNull(),
  safetyRating: moderationRatingEnum('safety_rating'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const moderationResults = pgTable('moderation_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  generationId: uuid('generation_id').references(() => generations.id, { onDelete: 'cascade' }),
  contentAssetId: uuid('content_asset_id').references(() => contentAssets.id, { onDelete: 'cascade' }),
  platform: platformEnum('platform').notNull(),
  rating: moderationRatingEnum('rating').notNull(),
  detectedIssues: jsonb('detected_issues').$type<string[]>(),
  suggestedFixes: jsonb('suggested_fixes').$type<string[]>(),
  rawResult: jsonb('raw_result'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const contentPlans = pgTable('content_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  contentAssetId: uuid('content_asset_id').notNull().references(() => contentAssets.id, { onDelete: 'cascade' }),
  platform: platformEnum('platform').notNull(),
  plannedFor: timestamp('planned_for'),
  caption: text('caption'),
  hashtags: jsonb('hashtags').$type<string[]>(),
  platformNotes: text('platform_notes'),
  status: contentPlanStatusEnum('status').default('draft').notNull(),
  manuallyPostedAt: timestamp('manually_posted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const exportPackages = pgTable('export_packages', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  contentAssetId: uuid('content_asset_id').notNull().references(() => contentAssets.id, { onDelete: 'cascade' }),
  contentPlanId: uuid('content_plan_id').references(() => contentPlans.id, { onDelete: 'set null' }),
  platform: platformEnum('platform').notNull(),
  caption: text('caption'),
  hashtags: jsonb('hashtags').$type<string[]>(),
  platformNotes: text('platform_notes'),
  checklist: jsonb('checklist').$type<string[]>(),
  metadata: jsonb('metadata'),
  r2ZipKey: varchar('r2_zip_key', { length: 500 }),
  bucket: varchar('bucket', { length: 255 }),
  status: exportPackageStatusEnum('status').default('ready').notNull(),
  downloadedAt: timestamp('downloaded_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const generationCosts = pgTable('generation_costs', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  generationId: uuid('generation_id').notNull().references(() => generations.id, { onDelete: 'cascade' }),
  provider: providerEnum('provider').notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  inputUnits: integer('input_units'),
  outputUnits: integer('output_units'),
  estimatedCostUsd: decimal('estimated_cost_usd', { precision: 10, scale: 4 }),
  actualCostUsd: decimal('actual_cost_usd', { precision: 10, scale: 4 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const usageQuotas = pgTable('usage_quotas', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  monthlyImageLimit: integer('monthly_image_limit').default(500).notNull(),
  monthlyVideoLimit: integer('monthly_video_limit').default(50).notNull(),
  monthlySpendLimitUsd: decimal('monthly_spend_limit_usd', { precision: 10, scale: 2 }).default('100.00').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

---

## 7. Infra Layer

### apps/api/src/infra/db.ts

```typescript
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '../db/schema'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
export const db = drizzle(pool, { schema })
```

### apps/api/src/infra/r2.ts

```typescript
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function uploadToR2(options: {
  key: string
  body: Buffer
  contentType: string
  visibility?: 'public' | 'private'
}): Promise<{ key: string; url?: string; bucket: string }> {
  const bucket = options.visibility === 'public'
    ? process.env.R2_BUCKET_NAME!
    : process.env.R2_PRIVATE_BUCKET_NAME || process.env.R2_BUCKET_NAME!

  await r2.send(new PutObjectCommand({
    Bucket: bucket,
    Key: options.key,
    Body: options.body,
    ContentType: options.contentType,
  }))

  const url = options.visibility === 'public'
    ? `${process.env.R2_PUBLIC_URL}/${options.key}`
    : undefined

  return { key: options.key, url, bucket }
}

export async function getSignedR2Url(key: string, bucket: string): Promise<string> {
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 60 * 15 }
  )
}

export async function deleteFromR2(key: string, bucket?: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({
    Bucket: bucket || process.env.R2_BUCKET_NAME,
    Key: key,
  }))
}
```

### apps/api/src/infra/queue.ts

```typescript
import { Queue, QueueEvents } from 'bullmq'
import IORedis from 'ioredis'

export const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
})

export const generationQueue = new Queue('generations', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
})

export const generationQueueEvents = new QueueEvents('generations', { connection })
```

---

## 8. API Modules

### 8.1 Auth and Workspaces Module

MVP may start with a simple auth implementation, but the data model must support multiple users and workspaces from the beginning.

#### Required behavior

- Every protected route requires an authenticated user.
- Every core entity belongs to a `workspaceId`.
- Users can only access entities from workspaces they belong to.
- Future billing and quotas are workspace-based.

#### Routes

| Method | Path | Handler |
|--------|------|---------|
| POST | `/auth/login` | Login user |
| POST | `/auth/logout` | Logout user |
| GET | `/auth/me` | Current user |
| GET | `/workspaces` | List user workspaces |
| POST | `/workspaces` | Create workspace |
| GET | `/workspaces/:id` | Get workspace |
| PUT | `/workspaces/:id` | Update workspace |
| POST | `/workspaces/:id/members` | Add member |

---

### 8.2 Characters Module

Characters represent visual identity. They are the foundation for face/body consistency, but they are not the full influencer persona.

#### character.schema.ts

```typescript
import { z } from 'zod'

export const CreateCharacterSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  triggerWord: z.string().max(100).optional(),
  isAdult: z.boolean().default(true),
})

export const UpdateCharacterSchema = CreateCharacterSchema.partial()
```

#### Repository methods

- `findAll(workspaceId): Promise<Character[]>`
- `findById(workspaceId, id): Promise<CharacterWithPhotos | null>`
- `create(workspaceId, data): Promise<Character>`
- `update(workspaceId, id, data): Promise<Character>`
- `delete(workspaceId, id): Promise<void>`
- `addPhoto(workspaceId, characterId, r2Key, bucket, url, metadata): Promise<CharacterPhoto>`
- `deletePhoto(workspaceId, photoId): Promise<void>`
- `setPrimaryPhoto(workspaceId, characterId, photoId): Promise<void>`

#### Routes

| Method | Path | Handler |
|--------|------|---------|
| GET | `/characters` | List characters |
| POST | `/characters` | Create character |
| GET | `/characters/:id` | Get character |
| PUT | `/characters/:id` | Update character |
| DELETE | `/characters/:id` | Delete character |
| POST | `/characters/:id/photos` | Upload reference photo |
| DELETE | `/characters/:id/photos/:photoId` | Delete photo |
| PUT | `/characters/:id/photos/:photoId/primary` | Set primary photo |

---

### 8.3 Influencer Persona Module

Personas define how the character behaves as a social influencer.

#### persona.schema.ts

```typescript
import { z } from 'zod'

export const UpsertInfluencerProfileSchema = z.object({
  characterId: z.string().uuid(),
  displayName: z.string().min(1).max(255),
  niche: z.string().optional(),
  audience: z.string().optional(),
  backstory: z.string().optional(),
  personalityTraits: z.array(z.string()).default([]),
  toneOfVoice: z.string().optional(),
  languages: z.array(z.string()).default(['en']),
  contentPillars: z.array(z.string()).default([]),
  visualStyle: z.string().optional(),
  boundaries: z.string().optional(),
  sfwPolicy: z.string().optional(),
  nsfwPolicy: z.string().optional(),
  disclosureNote: z.string().optional(),
})
```

#### Routes

| Method | Path | Handler |
|--------|------|---------|
| GET | `/personas` | List personas |
| POST | `/personas` | Create persona |
| GET | `/personas/:id` | Get persona |
| PUT | `/personas/:id` | Update persona |
| DELETE | `/personas/:id` | Delete persona |
| GET | `/characters/:id/persona` | Get persona for character |
| PUT | `/characters/:id/persona` | Upsert persona for character |

---

### 8.4 Prompt Templates Module

Prompt templates transform high-level content requests into safer, more consistent generation prompts.

#### prompt-template.schema.ts

```typescript
import { z } from 'zod'

export const CreatePromptTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  platform: z.enum(['instagram', 'tiktok', 'x', 'youtube_shorts', 'onlyfans', 'privacy', 'other']),
  contentRating: z.enum(['sfw', 'suggestive', 'adult']).default('sfw'),
  mediaType: z.enum(['image', 'video']),
  template: z.string().min(1),
  negativePrompt: z.string().optional(),
  variables: z.array(z.string()).default([]),
})
```

#### Default system template: Instagram SFW sensual portrait

```txt
Create a high-quality editorial portrait of {{displayName}}, an adult fictional virtual influencer.

Persona:
- Niche: {{niche}}
- Visual style: {{visualStyle}}
- Personality: {{personalityTraits}}

Scene:
- Outfit: {{outfit}}
- Location: {{location}}
- Mood: confident, elegant, sensual but safe for work
- Composition: {{composition}}

Platform constraints:
- Safe for Instagram and TikTok
- No nudity
- No explicit sexual pose
- No visible nipples or genitals
- No pornographic framing
- The person must clearly appear adult
- Avoid minors or ambiguous age

Technical quality:
- Natural skin texture
- Realistic face
- Correct hands
- High-resolution editorial lighting
```

#### Routes

| Method | Path | Handler |
|--------|------|---------|
| GET | `/prompt-templates` | List templates |
| POST | `/prompt-templates` | Create custom template |
| GET | `/prompt-templates/:id` | Get template |
| PUT | `/prompt-templates/:id` | Update template |
| DELETE | `/prompt-templates/:id` | Delete template |
| POST | `/prompt-templates/:id/render` | Render final prompt with variables |

---

### 8.5 Campaigns Module

Campaigns organize content production around a goal, platform, and persona.

#### campaign.schema.ts

```typescript
import { z } from 'zod'

export const CreateCampaignSchema = z.object({
  influencerProfileId: z.string().uuid(),
  name: z.string().min(1).max(255),
  goal: z.string().optional(),
  platform: z.enum(['instagram', 'tiktok', 'x', 'youtube_shorts', 'onlyfans', 'privacy', 'other']),
  contentRating: z.enum(['sfw', 'suggestive', 'adult']).default('sfw'),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
})

export const UpdateCampaignSchema = CreateCampaignSchema.partial()
```

#### Routes

| Method | Path | Handler |
|--------|------|---------|
| GET | `/campaigns` | List campaigns |
| POST | `/campaigns` | Create campaign |
| GET | `/campaigns/:id` | Get campaign with ideas/assets |
| PUT | `/campaigns/:id` | Update campaign |
| DELETE | `/campaigns/:id` | Delete campaign |
| POST | `/campaigns/:id/ideas` | Create content idea |
| POST | `/campaigns/:id/generate-ideas` | Generate content ideas |
| POST | `/campaigns/:id/generate-assets` | Generate media assets from selected ideas |

---

### 8.6 Content Ideas Module

Content ideas are briefs before media generation.

#### Example idea

```json
{
  "title": "Luxury rooftop sunset portrait",
  "description": "A confident editorial portrait on a rooftop at golden hour.",
  "hook": "POV: your soft life era starts tonight.",
  "captionDraft": "Golden hour, clear mind, high standards.",
  "hashtags": ["#virtualinfluencer", "#aigirl", "#fashionportrait", "#luxurylifestyle"],
  "platform": "instagram"
}
```

#### Routes

| Method | Path | Handler |
|--------|------|---------|
| GET | `/content-ideas` | List ideas |
| GET | `/content-ideas/:id` | Get idea |
| PUT | `/content-ideas/:id` | Update idea |
| DELETE | `/content-ideas/:id` | Delete idea |
| POST | `/content-ideas/:id/generate` | Generate image/video from idea |

---

### 8.7 Generations Module

Generations are always async jobs. The generation module creates jobs and stores the media result.

#### generation.schema.ts

```typescript
import { z } from 'zod'

export const CreateGenerationSchema = z.object({
  prompt: z.string().min(1),
  negativePrompt: z.string().optional(),
  type: z.enum(['image', 'video']),
  platform: z.enum(['instagram', 'tiktok', 'x', 'youtube_shorts', 'onlyfans', 'privacy', 'other']).default('instagram'),
  contentRating: z.enum(['sfw', 'suggestive', 'adult']).default('sfw'),
  characterId: z.string().uuid().optional(),
  influencerProfileId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
  promptTemplateId: z.string().uuid().optional(),
  templateVariables: z.record(z.any()).optional(),
  width: z.number().int().optional().default(1024),
  height: z.number().int().optional().default(1024),
  duration: z.number().int().min(1).max(10).optional().default(5),
  idempotencyKey: z.string().optional(),
})

export type CreateGenerationInput = z.infer<typeof CreateGenerationSchema>
```

#### Service behavior

`createGeneration(data)`:

1. Validate workspace quota.
2. Validate adult mode rules:
   - If `contentRating = adult`, require `ENABLE_ADULT_MODE=true`.
   - Require workspace `adultModeEnabled=true`.
   - Reject adult content for Instagram/TikTok.
3. Fetch persona and primary character photo if provided.
4. Render final prompt from template if `promptTemplateId` is provided.
5. Apply platform safety pre-check.
6. Create DB record with `status: queued`.
7. Enqueue BullMQ job with attempts/backoff.
8. Return the queued generation record.

#### Routes

| Method | Path | Handler |
|--------|------|---------|
| POST | `/generations` | Create generation |
| GET | `/generations/:id` | Get generation status/result |
| GET | `/generations` | List generations |
| POST | `/generations/:id/cancel` | Cancel queued generation |
| POST | `/generations/:id/regenerate` | Regenerate using same settings |

---

### 8.8 Moderation and Platform Safety Module

This module reviews prompts and generated assets for platform fit.

#### moderation.service.ts

Responsibilities:

- Prompt pre-check before generation.
- Media post-check after generation.
- Assign platform-specific rating:
  - `safe`
  - `borderline`
  - `rejected`
- Detect issues:
  - nudity
  - lingerie emphasis
  - explicit pose
  - sexual body-part focus
  - ambiguous age
  - real-person likeness risk
  - watermark
  - distorted anatomy
  - unsafe caption/hashtag
- Suggest fixes.

#### Platform v1 rules

Instagram/TikTok SFW/suggestive mode:

```txt
Allowed:
- clothed fashion/editorial looks
- non-explicit glamour
- non-explicit swimwear
- fitness/lifestyle
- dance/trends
- beauty/fashion content

Rejected:
- nudity
- explicit sexual pose
- visible nipples/genitals
- pornographic framing
- minors/ambiguous age
- captions implying explicit sexual services
```

#### Routes

| Method | Path | Handler |
|--------|------|---------|
| POST | `/moderation/check-prompt` | Check prompt before generation |
| POST | `/moderation/check-generation/:id` | Check generated media |
| GET | `/moderation/generations/:id` | Get moderation results for generation |

---

### 8.9 Content Assets and Approval Module

Assets represent generated media prepared for publishing.

#### Approval flow

```txt
generated → reviewed → approved → scheduled → published
            ↘ rejected
```

#### Routes

| Method | Path | Handler |
|--------|------|---------|
| GET | `/assets` | List assets |
| GET | `/assets/:id` | Get asset |
| PUT | `/assets/:id` | Update asset metadata |
| POST | `/assets/:id/review` | Mark as reviewed |
| POST | `/assets/:id/approve` | Approve asset |
| POST | `/assets/:id/reject` | Reject asset |
| GET | `/approvals` | List generated/reviewed assets awaiting approval |

---

### 8.10 Content Plans and Manual Export Module

v1 should not connect to social accounts or auto-publish. Lumora should help the user plan content and export a ready-to-post package that can be manually uploaded to Instagram, TikTok, X, or another platform.

#### Content plan statuses

```txt
draft
approved
exported
manually_posted
cancelled
```

#### Export package contents

Each export package should be downloadable as a ZIP file:

```txt
media/
  image-or-video.ext

caption.txt
hashtags.txt
platform-notes.txt
safety-checklist.txt
metadata.json
```

#### Example safety-checklist.txt

```txt
[ ] No nudity
[ ] No explicit pose
[ ] Character clearly appears adult
[ ] Caption is SFW
[ ] Hashtags are platform-safe
[ ] No real-person likeness issue
[ ] Ready for manual posting
```

#### Routes

| Method | Path | Handler |
|--------|------|---------|
| GET | `/content-plans` | List content plans |
| POST | `/content-plans` | Create content plan |
| GET | `/content-plans/:id` | Get content plan |
| PUT | `/content-plans/:id` | Update content plan |
| DELETE | `/content-plans/:id` | Delete content plan |
| POST | `/content-plans/:id/mark-exported` | Mark plan as exported |
| POST | `/content-plans/:id/mark-manually-posted` | Mark plan as manually posted |
| GET | `/exports` | List export packages |
| POST | `/exports` | Create export package from approved asset/content plan |
| GET | `/exports/:id` | Get export package |
| GET | `/exports/:id/download` | Download export ZIP |
| DELETE | `/exports/:id` | Archive/delete export package |

---

### 8.11 Gallery Module

The gallery reads from `generations` and joins characters, personas, campaigns, assets, and moderation results.

#### gallery.repository.ts

- `findAll(options): Promise<{ items: GalleryItem[], total: number }>`
- `findById(workspaceId, id): Promise<GalleryItem | null>`
- `delete(workspaceId, id): Promise<void>`

#### gallery.service.ts

- `listGallery(options)` — paginated, defaults page=1, limit=20.
- Defaults to completed generations only.
- Can filter by character, persona, campaign, type, platform, content rating, moderation rating, and approval status.
- `deleteItem(id)` deletes R2 media if it exists.

#### Routes

| Method | Path | Handler |
|--------|------|---------|
| GET | `/gallery` | List gallery |
| GET | `/gallery/:id` | Get gallery item |
| DELETE | `/gallery/:id` | Delete gallery item |

---

### 8.12 Storage Module

Character photos and generated media should be private by default. Public URLs are only for explicitly public SFW assets.

#### Routes

| Method | Path | Handler |
|--------|------|---------|
| POST | `/storage/upload` | Upload image file |
| GET | `/storage/signed-url` | Get signed URL for private media |
| DELETE | `/storage/:key` | Delete media |

Rules:

- Max image upload size: 10MB.
- Allowed image types: JPEG, PNG, WEBP.
- Max video result size should be configurable.
- Adult/private content must never be stored in public R2 paths.
- Use deterministic keys:
  - `characters/{characterId}/{photoId}.{ext}`
  - `generations/{generationId}.{ext}`
  - `campaigns/{campaignId}/assets/{assetId}.{ext}`

---

### 8.13 Usage and Cost Module

This module prevents unexpected AI spend.

#### Routes

| Method | Path | Handler |
|--------|------|---------|
| GET | `/usage/current-month` | Current usage summary |
| GET | `/usage/costs` | Cost breakdown |
| GET | `/usage/quotas` | Workspace quota |
| PUT | `/usage/quotas` | Update quota |

Track:

- Number of images generated.
- Number of videos generated.
- Failed jobs.
- Provider/model usage.
- Estimated cost.
- Actual cost where available.
- Workspace monthly limits.

---

## 9. AI Module

### ai/image/image.service.ts

Exports:

#### `generateImageWithoutCharacter(prompt, negativePrompt, width, height, settings): Promise<GeneratedMedia>`

- Provider: Together AI
- Default model: `black-forest-labs/FLUX.1-schnell-Free`
- Use for non-character generations or fallback.
- Return:
  - `buffer`
  - `provider`
  - `model`
  - `modelVersion`
  - `metadata`
  - `estimatedCostUsd`

#### `generateImageWithCharacter(prompt, negativePrompt, referencePhotoUrl, width, height, settings): Promise<GeneratedMedia>`

- Provider: fal.ai
- Default model: `fal-ai/ip-adapter-face-id`
- Use for character-consistent generations.
- Fallback: `fal-ai/flux/dev/image-to-image`
- Return same `GeneratedMedia` shape.

### ai/video/video.service.ts

Exports:

#### `generateVideo(prompt, referencePhotoUrl?, duration, settings): Promise<GeneratedMedia>`

- Provider: fal.ai
- Character video:
  - `fal-ai/kling-video/v1.6/standard/image-to-video`
- Non-character video:
  - `fal-ai/kling-video/v1.6/standard/text-to-video`
- Use `fal.subscribe()` for async provider polling.
- Return `GeneratedMedia`.

### GeneratedMedia type

```typescript
export type GeneratedMedia = {
  buffer: Buffer
  contentType: string
  ext: string
  provider: 'together_ai' | 'fal_ai'
  model: string
  modelVersion?: string
  metadata?: unknown
  estimatedCostUsd?: string
}
```

---

## 10. Generation Worker

File: `apps/api/worker.ts`

The worker is a separate Railway service.

Responsibilities:

1. Pull jobs from the `generations` queue.
2. Update status to `processing`.
3. Re-load generation from DB to avoid stale job payloads.
4. Run provider-specific image/video generation.
5. Upload media to R2.
6. Run post-generation moderation.
7. Create `contentAsset` if moderation passes or is borderline.
8. Update generation status:
   - `completed`
   - `moderation_failed`
   - `failed`
9. Record usage/cost.
10. Log structured metadata.

### Worker skeleton

```typescript
import { Worker } from 'bullmq'
import { connection } from './src/infra/queue'
import { db } from './src/infra/db'
import { generations } from './src/db/schema'
import { eq } from 'drizzle-orm'
import {
  generateImageWithoutCharacter,
  generateImageWithCharacter
} from './src/modules/ai/image/image.service'
import { generateVideo } from './src/modules/ai/video/video.service'
import { uploadToR2 } from './src/infra/r2'
import { runPostGenerationModeration } from './src/modules/moderation/moderation.service'
import { createContentAssetFromGeneration } from './src/modules/content-assets/content-asset.service'
import { recordGenerationCost } from './src/modules/usage/usage.service'

const worker = new Worker('generations', async (job) => {
  const { generationId } = job.data

  const generation = await db.query.generations.findFirst({
    where: eq(generations.id, generationId),
  })

  if (!generation) {
    throw new Error(`Generation ${generationId} not found`)
  }

  await db.update(generations)
    .set({ status: 'processing', updatedAt: new Date() })
    .where(eq(generations.id, generationId))

  const settings = generation.generationSettings || {}

  const media = generation.type === 'image'
    ? generation.referencePhotoUrl
      ? await generateImageWithCharacter(
          generation.finalPrompt || generation.prompt,
          generation.negativePrompt || undefined,
          generation.referencePhotoUrl,
          generation.width || 1024,
          generation.height || 1024,
          settings
        )
      : await generateImageWithoutCharacter(
          generation.finalPrompt || generation.prompt,
          generation.negativePrompt || undefined,
          generation.width || 1024,
          generation.height || 1024,
          settings
        )
    : await generateVideo(
        generation.finalPrompt || generation.prompt,
        generation.referencePhotoUrl || undefined,
        generation.duration || 5,
        settings
      )

  const r2Key = `generations/${generationId}.${media.ext}`

  const upload = await uploadToR2({
    key: r2Key,
    body: media.buffer,
    contentType: media.contentType,
    visibility: generation.contentRating === 'adult' ? 'private' : 'private',
  })

  await db.update(generations).set({
    status: 'completed',
    r2Key: upload.key,
    bucket: upload.bucket,
    url: upload.url,
    provider: media.provider,
    model: media.model,
    modelVersion: media.modelVersion,
    metadata: media.metadata as any,
    updatedAt: new Date(),
  }).where(eq(generations.id, generationId))

  const moderation = await runPostGenerationModeration(generationId)

  if (moderation.rating === 'rejected') {
    await db.update(generations).set({
      status: 'moderation_failed',
      updatedAt: new Date(),
    }).where(eq(generations.id, generationId))
    return
  }

  await createContentAssetFromGeneration(generationId, moderation.rating)

  await recordGenerationCost({
    workspaceId: generation.workspaceId,
    generationId,
    provider: media.provider,
    model: media.model,
    estimatedCostUsd: media.estimatedCostUsd,
  })

}, {
  connection,
  concurrency: Number(process.env.GENERATION_WORKER_CONCURRENCY || 3),
})

worker.on('failed', async (job, err) => {
  if (!job) return

  await db.update(generations).set({
    status: 'failed',
    error: err.message,
    updatedAt: new Date(),
  }).where(eq(generations.id, job.data.generationId))
})
```

---

## 11. Hono App Entrypoint

File: `apps/api/src/index.ts`

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'

import { authRouter } from './modules/auth/auth.routes'
import { workspacesRouter } from './modules/workspaces/workspace.routes'
import { charactersRouter } from './modules/characters/character.routes'
import { personasRouter } from './modules/personas/persona.routes'
import { campaignsRouter } from './modules/campaigns/campaign.routes'
import { contentIdeasRouter } from './modules/content-ideas/content-idea.routes'
import { contentAssetsRouter } from './modules/content-assets/content-asset.routes'
import { contentPlansRouter } from './modules/content-plans/content-plan.routes'
import { exportsRouter } from './modules/exports/export.routes'
import { approvalsRouter } from './modules/approvals/approval.routes'
import { moderationRouter } from './modules/moderation/moderation.routes'
import { promptTemplatesRouter } from './modules/prompt-templates/prompt-template.routes'
import { galleryRouter } from './modules/gallery/gallery.routes'
import { generationsRouter } from './modules/generations/generation.routes'
import { storageRouter } from './modules/storage/storage.routes'
import { usageRouter } from './modules/usage/usage.routes'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({
  origin: process.env.WEB_URL || 'http://localhost:3000',
  credentials: true,
}))

app.get('/health', (c) => c.json({ status: 'ok' }))

app.route('/auth', authRouter)
app.route('/workspaces', workspacesRouter)
app.route('/characters', charactersRouter)
app.route('/personas', personasRouter)
app.route('/campaigns', campaignsRouter)
app.route('/content-ideas', contentIdeasRouter)
app.route('/assets', contentAssetsRouter)
app.route('/content-plans', contentPlansRouter)
app.route('/exports', exportsRouter)
app.route('/approvals', approvalsRouter)
app.route('/moderation', moderationRouter)
app.route('/prompt-templates', promptTemplatesRouter)
app.route('/gallery', galleryRouter)
app.route('/generations', generationsRouter)
app.route('/storage', storageRouter)
app.route('/usage', usageRouter)

serve({ fetch: app.fetch, port: Number(process.env.PORT || 3001) }, (info) => {
  console.log(`API running on http://localhost:${info.port}`)
})

export default app
```

---

## 12. Nuxt 4 Frontend

### nuxt.config.ts

```typescript
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],

  runtimeConfig: {
    honoApiUrl: process.env.HONO_API_URL || 'http://localhost:3001',
    public: {
      apiBase: '/api',
    },
  },
})
```

### Nitro BFF Proxy — apps/web/server/api/[...].ts

```typescript
import { joinURL } from 'ufo'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const path = event.path.replace('/api', '')
  const target = joinURL(config.honoApiUrl, path)

  return proxyRequest(event, target)
})
```

All browser requests must go through `/api/*`. The Hono API URL must not be exposed to the browser.

---

## 13. Frontend Pages

### Dashboard — pages/index.vue

- Show current workspace.
- Show active campaigns.
- Show pending approvals.
- Show content plans for the next 7 days.
- Show recent generations.
- Show monthly usage/cost estimate.

### Gallery — pages/gallery.vue

- Fetch `/api/gallery`.
- Filters:
  - character
  - persona
  - campaign
  - type
  - platform
  - content rating
  - moderation rating
  - approval status
- Render `<GalleryGrid>`.

### Characters — pages/characters/index.vue

- Fetch `/api/characters`.
- Render `<CharacterCard>` grid.
- Button: “New Character”.

### Character Detail — pages/characters/[id].vue

- Show character data.
- Show reference photo grid.
- Show primary photo.
- Show influencer persona form.
- Show recent generations.
- Show linked campaigns.
- Inline generation form prefilled with character/persona.

### Generate — pages/generate.vue

- Select:
  - character
  - persona
  - campaign
  - platform
  - content rating
  - image/video
  - prompt template
  - variables
  - dimensions/duration
- Show final prompt preview.
- Run prompt pre-check.
- Create generation.
- Poll job status.
- Show output and moderation result.
- Let user approve/reject asset.

### Campaigns — pages/campaigns/index.vue

- List campaigns.
- Filter by persona, platform, status.

### Campaign Detail — pages/campaigns/[id].vue

- Campaign overview.
- Content ideas list.
- Generate ideas.
- Generate assets.
- Approval status.
- Planned/exported/manually-posted states.

### Approvals — pages/approvals.vue

- Queue of generated/reviewed assets.
- Show media preview.
- Show prompt, campaign, platform, safety result.
- Approve/reject buttons.

### Calendar — pages/calendar.vue

- Monthly/weekly content planning calendar.
- Draft/approved/exported/manually-posted states.
- Manual mark-as-posted action.
- Create/download export packages.

---

## 14. Frontend Composables

### useGenerations.ts

```typescript
export function useGenerations() {
  const create = (data: any) => $fetch('/api/generations', { method: 'POST', body: data })
  const get = (id: string) => $fetch(`/api/generations/${id}`)
  const list = (params?: any) => $fetch('/api/generations', { query: params })
  const cancel = (id: string) => $fetch(`/api/generations/${id}/cancel`, { method: 'POST' })
  const regenerate = (id: string) => $fetch(`/api/generations/${id}/regenerate`, { method: 'POST' })

  async function pollUntilDone(id: string, onUpdate?: (g: any) => void, intervalMs = 2000): Promise<any> {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const gen = await get(id)
          onUpdate?.(gen)

          if (['completed', 'failed', 'cancelled', 'expired', 'moderation_failed'].includes(gen.status)) {
            clearInterval(interval)

            if (gen.status === 'completed') resolve(gen)
            else reject(new Error(gen.error || gen.status))
          }
        } catch (e) {
          clearInterval(interval)
          reject(e)
        }
      }, intervalMs)
    })
  }

  return { create, get, list, cancel, regenerate, pollUntilDone }
}
```

### Other composables

- `useCharacters.ts`
- `usePersonas.ts`
- `useCampaigns.ts`
- `useContentIdeas.ts`
- `useContentAssets.ts`
- `useApprovals.ts`
- `useContentPlans.ts`
- `useExports.ts`
- `usePromptTemplates.ts`
- `useGallery.ts`
- `useUsage.ts`

---

## 15. Key Constraints and Rules

### Architecture

- Never expose the Hono API URL to the browser.
- All frontend requests go to `/api/*` through the Nitro proxy.
- Worker is a separate Railway service.
- Generations are always async.
- BullMQ worker concurrency defaults to 3.
- Adjust worker concurrency based on provider API limits.
- All Drizzle queries must use parameterized inputs.
- No raw SQL with interpolated user input.
- Every user-facing entity must belong to a workspace.
- Every protected query must scope by `workspaceId`.

### Storage

- Character photos go through the Hono API.
- Generated media goes to R2.
- Store `r2Key`, `bucket`, `visibility`, `contentType`, and `sizeBytes`.
- Do not rely only on public URLs.
- Private content must use signed URLs.
- Adult content must never use public R2 URLs.

### Generation

- If `characterId` is provided and primary photo exists, use character-aware generation.
- Without character/reference image, use text-to-image or text-to-video.
- Store normalized generation settings for reproducibility.
- Store provider metadata for debugging.
- Use `idempotencyKey` to prevent duplicate jobs.

### Safety

- v1 supports only `sfw` and `suggestive`.
- `adult` content is blocked unless feature flag and workspace adult mode are enabled.
- Adult content is blocked for Instagram/TikTok.
- Always run prompt pre-check and media post-check.
- Any generation with rejected moderation becomes `moderation_failed`.
- Content should not imitate a real person without consent.
- Characters must clearly be adult-coded.
- No minors or ambiguous-age characters.

### Publishing

- v1 should support manual export/download and scheduling metadata.
- Auto-publishing should remain disabled behind `ENABLE_SOCIAL_INTEGRATIONS=false`.
- No content should be published without approval.
- Recommended publishing flow:
  - generated
  - reviewed
  - approved
  - scheduled
  - published

### Cost

- Every generation should estimate or record cost.
- Workspace quotas should prevent runaway spend.
- Video limits should be much lower than image limits.
- Show monthly usage in the dashboard.

---

## 16. Railway Deployment

### Services to create in Railway

| Service | Source | Start Command |
|--------|--------|---------------|
| `web` | `apps/web` | `node .output/server/index.mjs` |
| `api` | `apps/api` | `node dist/index.js` |
| `worker` | `apps/api` | `node dist/worker.js` |
| `postgres` | Railway Postgres plugin | managed |
| `redis` | Railway Redis plugin | managed |

### railway.json

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### apps/api/nixpacks.toml

```toml
[phases.build]
cmds = ["pnpm install --frozen-lockfile", "pnpm run build"]

[start]
cmd = "node dist/index.js"
```

### apps/api/nixpacks.worker.toml

```toml
[phases.build]
cmds = ["pnpm install --frozen-lockfile", "pnpm run build"]

[start]
cmd = "node dist/worker.js"
```

### apps/web/nixpacks.toml

```toml
[phases.build]
cmds = ["pnpm install --frozen-lockfile", "pnpm run build"]

[start]
cmd = "node .output/server/index.mjs"
```

### API service env

```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
TOGETHER_AI_API_KEY=...
FAL_KEY=...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=lumora
R2_PRIVATE_BUCKET_NAME=lumora-private
R2_PUBLIC_URL=...
JWT_SECRET=...
PORT=${{RAILWAY_PORT}}
WEB_URL=https://lumora-web.up.railway.app
ENABLE_ADULT_MODE=false
ENABLE_SOCIAL_INTEGRATIONS=false
```

### Worker service env

```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
TOGETHER_AI_API_KEY=...
FAL_KEY=...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=lumora
R2_PRIVATE_BUCKET_NAME=lumora-private
R2_PUBLIC_URL=...
ENABLE_ADULT_MODE=false
GENERATION_WORKER_CONCURRENCY=3
```

### Web service env

```bash
HONO_API_URL=https://lumora-api.up.railway.app
PORT=${{RAILWAY_PORT}}
```

---

## 17. Database Migrations

On first deploy, run migrations from the `api` service via a one-off Railway command:

```bash
pnpm --filter @lumora/api db:migrate
```

### drizzle.config.ts

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

---

## 18. Implementation Order for Claude Code

Implement in this order:

1. **Monorepo scaffold** — pnpm workspace, turbo, root scripts, shared package.
2. **Shared Zod schemas** — common enums and DTOs.
3. **Database schema** — users, workspaces, characters, personas, campaigns, generations, assets, moderation, scheduling, usage.
4. **Infra layer** — db, r2, queue, auth.
5. **Auth/workspaces module** — basic authentication and workspace scoping.
6. **Characters module** — CRUD + reference photos.
7. **Influencer persona module** — persona CRUD linked to characters.
8. **Prompt templates module** — default SFW platform templates + render endpoint.
9. **Moderation module** — prompt pre-check and post-generation result model.
10. **AI modules** — image and video services.
11. **Generations module** — create/list/status/cancel/regenerate.
12. **Generation worker** — provider calls, upload, moderation, asset creation, cost recording.
13. **Campaigns module** — campaigns and ideas.
14. **Content assets and approval module** — review/approve/reject.
15. **Content plans and export module** — internal calendar, export packages, and manual mark-as-posted.
16. **Gallery module** — filtered/paginated cross-entity media view.
17. **Usage/cost module** — quotas and monthly usage.
18. **Hono entrypoint** — wire routers and middleware.
19. **Nuxt scaffold** — config, proxy, layout, navigation.
20. **Composables** — typed client functions.
21. **Frontend pages** — dashboard, gallery, characters, generate, campaigns, approvals, calendar, exports.
22. **Frontend components** — UI, forms, grids, cards, safety panels.
23. **Railway config** — API, worker, web, env variables.
24. **Seed data** — default prompt templates and platform safety presets.

---

## 19. Roadmap

### V1 — SFW AI Influencer Studio

Goal: generate and manage SFW/suggestive social content safely.

Features:

- Auth and workspaces.
- Character creation.
- Reference photo management.
- Influencer persona profile.
- Image generation.
- Short video generation.
- Prompt templates.
- Platform presets for Instagram/TikTok.
- Campaigns and content ideas.
- Caption and hashtag drafts.
- Moderation and platform safety review.
- Approval queue.
- Content calendar.
- Manual export/download packages.
- Export ZIP with media, caption, hashtags, platform notes, safety checklist, and metadata.
- Track exported/manually-posted status.
- Usage and cost tracking.

Do not include:

- Explicit NSFW generation.
- Auto-publishing.
- Social account connections.
- OAuth integrations.
- Postiz/Ayrshare/direct social integrations.
- Subscriber chat.
- Real-person likeness cloning without consent.

### V2 — Growth and Operations Workflow

Goal: help users run the AI influencer like a content business.

Features:

- Weekly/monthly content calendar generation.
- Batch generation.
- A/B prompt variants.
- Brand kit / visual identity memory.
- Analytics tracking.
- Performance notes per post.
- Content repurposing:
  - image → story
  - portrait → reel prompt
  - campaign → carousel
- Manual performance import.
- Batch export.
- Mobile-friendly download.
- Copy-to-clipboard captions.
- Calendar reminders.
- Improved manual posting workflow.

### V3 — Adult/Private Monetization Mode and Optional Social Integrations

Goal: support adult/private platforms only with strict separation and compliance. Optional integrations such as Postiz, direct Instagram/TikTok APIs, or platform-specific publishing adapters should only be considered after product-market fit.

Features:

- Adult mode workspace setting.
- Age gate.
- Explicit user acknowledgement.
- Separate private storage.
- Strict moderation.
- OnlyFans/Privacy campaign types.
- PPV content bundle planning.
- Adult prompt templates.
- No adult content for Instagram/TikTok.
- Audit logs.
- Consent/IP checks.
- Disclosure rules.
- Manual review before export.

Adult/private mode must be architecturally isolated from SFW workflows. Social integrations are out of scope for v1 and should remain optional in later versions.

---

## Implementation Progress

### Iteration 1 — Scaffold and contracts

Completed:

- [x] Created pnpm workspace, Turbo config, root package scripts, `.npmrc`, `.env.example`, Railway/Nixpacks config.
- [x] Created `@lumora/shared` package with Zod enums and DTO schemas for characters, personas, campaigns/content ideas, generations, prompt templates, approvals, content plans, and exports.
- [x] Created `@lumora/api` package with TypeScript config, Drizzle config, full PostgreSQL schema, infra layer (`db`, `r2`, `queue`, auth middleware), Hono entrypoint, route stubs for all spec modules, AI/worker service stubs, and generation worker skeleton.
- [x] Created `@lumora/web` Nuxt 4 app with Tailwind, Pinia module, Nitro `/api/*` proxy, default layout/navigation, MVP route pages, and core composables.
- [x] Generated `pnpm-lock.yaml` and installed dependencies.

Verification:

- [x] `pnpm --filter @lumora/shared typecheck`
- [x] `pnpm --filter @lumora/api typecheck`
- [x] `pnpm --filter @lumora/web exec nuxt prepare`
- [x] `pnpm --filter @lumora/web typecheck`

Next:

- [ ] Replace API route stubs with real repositories/services starting with auth/workspaces and characters.
- [ ] Add seed prompt templates and platform safety presets.
- [ ] Add real frontend components/forms after backend routes persist data.

### Iteration 2 — Auth, workspace, and character persistence

Completed:

- [x] Added shared `loginSchema`, workspace create/update/member schemas, and exports.
- [x] Added API JSON validation helper and standard not-found helper.
- [x] Replaced auth route stub with DB-backed login/upsert flow, default workspace creation, workspace listing, and `/auth/me` lookup.
- [x] Replaced workspace route stub with DB-backed list/create/get/update/add-member operations scoped to authenticated users.
- [x] Replaced character route stub with DB-backed CRUD plus reference photo metadata add/delete/set-primary operations scoped by `workspaceId`.
- [x] Hardened auth/workspace middleware so protected routes require existing user and workspace membership, including collection routes and nested routes.

Verification:

- [x] `pnpm --filter @lumora/shared typecheck`
- [x] `pnpm --filter @lumora/api typecheck`
- [x] `pnpm --filter @lumora/web typecheck`

Next:

- [ ] Implement influencer persona repositories/routes linked to characters.
- [ ] Implement prompt templates with default SFW system templates and render endpoint.
- [ ] Add database seed for platform safety presets/default templates.

### Iteration 3 — Personas and prompt templates

Completed:

- [x] Replaced influencer persona route stub with DB-backed list/create/get/update/delete and character-linked get/upsert flows.
- [x] Added `/characters/:id/persona` compatibility routes on the characters router matching the product API spec.
- [x] Added workspace and character ownership checks before persona create/upsert/update.
- [x] Replaced prompt template route stub with DB-backed list/create/get/update/delete and render endpoint.
- [x] Added default SFW Instagram image and TikTok video system prompt templates plus platform safety presets.
- [x] Added `db:seed` script to seed default system prompt templates.

Verification:

- [x] `pnpm --filter @lumora/api typecheck`
- [x] `pnpm --filter @lumora/shared typecheck`
- [x] `pnpm --filter @lumora/web typecheck`

Next:

- [ ] Implement moderation persistence and generation pre-check integration.
- [ ] Implement generation repository/service with adult-mode rules, idempotency, prompt rendering, queue enqueue.
- [ ] Implement usage quota checks before generation.

### Iteration 4 — Moderation, usage quotas, and generation queue

Completed:

- [x] Added moderation repository to persist prompt pre-check and post-generation moderation results.
- [x] Reworked moderation service with rejected/borderline keyword rules, persisted prompt checks, and scaffold post-generation checks.
- [x] Replaced moderation routes with DB-backed prompt check, generation check, and generation moderation history lookup.
- [x] Added usage repository for current-month image/video/failed counts, estimated/actual cost totals, quota get/update, and quota assertions.
- [x] Replaced usage routes with DB-backed current month, costs, quota get/update endpoints.
- [x] Added generation repository/service with idempotency lookup, adult-mode/platform rules, character/persona ownership checks, prompt template rendering, prompt pre-check integration, primary photo lookup, DB insert, and BullMQ enqueue.
- [x] Replaced generation route stub with create/list/get/cancel/regenerate endpoints.

Verification:

- [x] `pnpm --filter @lumora/api typecheck`
- [x] `pnpm --filter @lumora/shared typecheck`
- [x] `pnpm --filter @lumora/web typecheck`

Next:

- [ ] Implement campaigns and content ideas persistence.
- [ ] Implement content assets approval flow persistence.
- [ ] Add better DB indexes/migrations for idempotency and common filters.

### Iteration 5 — Campaigns, ideas, assets, and approvals

Completed:

- [x] Replaced campaign route stub with DB-backed list/create/get/update/delete.
- [x] Added campaign detail response with joined content ideas and content assets.
- [x] Added campaign content idea creation plus scaffold `generate-ideas` endpoint.
- [x] Added campaign `generate-assets` endpoint that queues generation with campaign/persona context.
- [x] Replaced content idea route stub with DB-backed list/get/update/delete plus `generate` endpoint.
- [x] Added content asset repository for list/get/update and approval status transitions.
- [x] Replaced content asset routes with persistent review/approve/reject flow.
- [x] Replaced approvals route with DB-backed generated/reviewed asset queue.

Verification:

- [x] `pnpm --filter @lumora/api typecheck`
- [x] `pnpm --filter @lumora/shared typecheck`
- [x] `pnpm --filter @lumora/web typecheck`

Next:

- [ ] Implement content plans and export package persistence.
- [ ] Implement gallery repository/service with filters and signed/private media handling.
- [ ] Add DB indexes/migrations for idempotency and common filters.

### Iteration 6 — Content plans, exports, and gallery

Completed:

- [x] Replaced content plan route stub with DB-backed list/create/get/update/delete and mark-exported/mark-manually-posted actions.
- [x] Enforced approved-asset requirement before creating/updating content plans.
- [x] Replaced export route stub with DB-backed list/create/get/download/archive flows.
- [x] Added manual export package metadata and default safety checklist manifest.
- [x] Added gallery repository with pagination and filters for character, persona, campaign, media type, platform, content rating, moderation rating, and approval status.
- [x] Replaced gallery routes with list/get/delete, private signed URL generation on detail, and R2 deletion before DB delete.

Verification:

- [x] `pnpm --filter @lumora/api typecheck`
- [x] `pnpm --filter @lumora/shared typecheck`
- [x] `pnpm --filter @lumora/web typecheck`

Next:

- [ ] Add Drizzle indexes/migration generation for idempotency and common filters.
- [ ] Harden storage upload/signed-url/delete routes with real R2 operations and validation.
- [ ] Add real provider integrations or provider adapter interfaces behind scaffold implementations.

### Iteration 7 — Agent working agreement

Completed:

- [x] Created root `AGENTS.md` with project overview, monorepo map, setup/development/build commands, security notes, and PR guidance.
- [x] Added strong agent roles: product guardian, TDD engineer, XP practitioner, YAGNI enforcer, KISS enforcer, and safety reviewer.
- [x] Documented mandatory TDD intent for each new execution and verification expectations.

Verification:

- [x] Documentation-only change; commands cross-checked against package scripts.

Next:

- [ ] Add Drizzle indexes/migration generation for idempotency and common filters.
- [ ] Harden storage upload/signed-url/delete routes with real R2 operations and validation.
- [ ] Add real provider integrations or provider adapter interfaces behind scaffold implementations.

### Iteration 9 — Storage validation and R2 routes

Completed:

- [x] Added storage service unit coverage for image type/size validation, safe key parsing, signed URL bucket requirements, and deterministic workspace-scoped upload keys.
- [x] Replaced storage route stubs with private R2 upload, signed URL, and delete operations.
- [x] Enforced 10MB image upload limit, JPEG/PNG/WEBP allowlist, safe R2 key prefixes, private visibility defaults, and bucket requirement for signed URLs.
- [x] Excluded API `*.test.ts` files from production TypeScript build output while keeping direct `tsx --test` verification.

Verification:

- [x] `pnpm --filter @lumora/api exec tsx --test src/modules/storage/storage.service.test.ts`
- [x] `pnpm --filter @lumora/api typecheck`

Next:

- [ ] Add Drizzle indexes/migration generation for idempotency and common filters.
- [ ] Add route/integration tests for storage upload/signed-url/delete with mocked R2 client.
- [ ] Add real provider integrations or provider adapter interfaces behind scaffold implementations.

### Iteration 10 — Database indexes and migration

Completed:

- [x] Added schema index regression coverage for generation idempotency and high-traffic workspace filters.
- [x] Added Drizzle indexes for workspace-scoped characters, personas, campaigns, ideas, generations, assets, content plans, exports, moderation results, generation costs, usage quotas, and workspace membership.
- [x] Added unique workspace/idempotency key index for generation de-duplication and unique workspace quota index.
- [x] Generated initial Drizzle migration and snapshot under `apps/api/src/db/migrations`.

Verification:

- [x] `pnpm --filter @lumora/api exec tsx --test src/db/schema-indexes.test.ts`
- [x] `pnpm --filter @lumora/api exec tsx --test src/modules/storage/storage.service.test.ts`
- [x] `pnpm --filter @lumora/shared typecheck`
- [x] `pnpm --filter @lumora/api typecheck`
- [x] `pnpm --filter @lumora/api db:generate`

Next:

- [ ] Add route/integration tests for storage upload/signed-url/delete with mocked R2 client.
- [ ] Add real provider integrations or provider adapter interfaces behind scaffold implementations.
- [ ] Begin replacing MVP frontend placeholder pages with data-backed forms/components.

### Iteration 11 — Test pyramid with vitest

Completed:

- [x] Installed vitest in `@lumora/api` and `@lumora/shared` packages.
- [x] Added `vitest.config.ts` to both packages.
- [x] Added `test` and `test:watch` scripts to package.json files and `test` task to turbo.json.
- [x] Split `apps/api/src/index.ts` into `app.ts` (Hono app factory, no side effects) and `index.ts` (server start) for testability.
- [x] Unit tests: `moderation.service` `runPromptPrecheck` — 12 tests covering safe, rejected, borderline, adult platform rules, and suggested fixes.
- [x] Unit tests: `prompt-template.service` `renderPromptTemplate` — 9 tests covering variable replacement, missing values, arrays, whitespace, and numeric values.
- [x] Unit tests: shared Zod schemas — 29 tests covering common enums, character CRUD schemas, and generation schema validation.
- [x] Integration test: Hono app health endpoint — 1 test.
- [x] Removed prior `node:test` files that conflicted with vitest discovery.
- [x] Updated `AGENTS.md` testing section with vitest commands, test pyramid table, and conventions.

Verification:

- [x] `pnpm --filter @lumora/shared test` (29 tests passed)
- [x] `pnpm --filter @lumora/api test` (22 tests passed)
- [x] `pnpm typecheck` (all packages green)

Total: **51 tests** across 4 test files.

### Iteration 12 — Real provider integrations and storage tests

Completed:

- [x] Replaced scaffold image/video services with real Together AI and fal.ai provider implementations.
- [x] Added `providers/together-image.provider.ts` — Together AI image generation via SDK with base64/URL response handling.
- [x] Added `providers/fal.provider.ts` — fal.ai face-ID image generation, text-to-video, image-to-video, and media download helper.
- [x] Updated `image.service.ts` to delegate to providers with optional Together AI fallback on fal.ai failure.
- [x] Updated `video.service.ts` to delegate to fal.ai provider.
- [x] Updated worker to handle fal.ai URL-based media (download before R2 upload) with proper error/status handling.
- [x] Unit tests: Together AI provider — 6 tests covering base64 response, URL response, parameter passthrough, empty data, default model, missing API key.
- [x] Unit tests: fal.ai provider — 9 tests covering face-ID image, text-to-video, image-to-video, dimensions, duration, custom model, missing key, download, download error.
- [x] Unit tests: image service — 5 tests covering delegation, settings passthrough, fallback, error propagation.
- [x] Unit tests: storage service — 22 tests covering image validation, key parsing, signed URL validation, key building.
- [x] Integration tests: storage routes — 7 tests covering upload accept/reject, signed URL, delete, path traversal block, with mocked R2 and auth.
- [x] Fixed storage DELETE route to use Hono catch-all pattern `/:key{.+}` for keys containing slashes.

Verification:

- [x] `pnpm --filter @lumora/api test` (73 tests passed)
- [x] `pnpm --filter @lumora/shared test` (29 tests passed)
- [x] `pnpm typecheck` (all packages green)

Total: **102 tests** across 8 test files.

Next:

- [ ] Begin replacing MVP frontend placeholder pages with data-backed forms/components.
- [ ] Add frontend layout, navigation, and page shells with real API integration.
- [ ] Add generation status polling and real-time updates in the UI.

### Iteration 13 — Data-backed frontend pages and components

Completed:

- [x] Replaced dashboard placeholder with data-backed overview cards for active campaigns, pending approvals, content plans, and monthly usage.
- [x] Added dashboard sections for recent campaigns and pending approval items.
- [x] Added character UI components: `CharacterCard`, `CharacterForm`, and `CharacterPhotoGrid`.
- [x] Replaced character list/new/detail placeholder pages with real API-backed screens, edit flow, delete flow, and photo metadata management actions.
- [x] Added gallery UI components: `GalleryGrid`, `GalleryItem`, and `GenerationStatusBadge`.
- [x] Replaced gallery placeholder with filterable, paginated API-backed gallery view.
- [x] Replaced approvals placeholder with API-backed approval queue and approve/reject actions.
- [x] Replaced calendar placeholder with API-backed content plan list grouped by planned date.
- [x] Replaced generate placeholder with real generation creation form and polling status panel.
- [x] Added campaign UI components: `CampaignCard` and `CampaignForm`.
- [x] Replaced campaign list/new/detail placeholder pages with API-backed filters, campaign creation, status changes, idea creation, generated starter ideas, asset queueing, and delete flow.

Verification:

- [x] `pnpm --filter @lumora/web typecheck`
- [x] `pnpm test` (102 tests passed)
- [x] `pnpm typecheck` (all packages green)

Next:

- [ ] Add frontend route/component tests for core form and status utilities.
- [ ] Add persona editor component on character detail (`InfluencerPersonaForm`).
- [ ] Add real upload UX wiring for character reference photos through `/api/storage/upload`.
- [ ] Add manual export package creation/download UI.

### Iteration 14 — Persona editing, uploads, and export workflow

Completed:

- [x] Added Vitest to `@lumora/web`, web test script, and web Vitest config.
- [x] Converted existing web character utility tests from `node:test` to Vitest and removed timezone-sensitive assertion.
- [x] Added tested frontend helper utilities for persona list fields, character photo metadata mapping, and primary-photo endpoint construction.
- [x] Added `InfluencerPersonaForm` and wired character detail to `/api/characters/:id/persona` get/upsert flow.
- [x] Added reusable `FileUpload` component and wired character detail reference-photo uploads through `/api/storage/upload` followed by `/api/characters/:id/photos` metadata creation.
- [x] Updated `CharacterPhotoGrid` to use private signed URLs and fixed set-primary calls to the correct `/primary` API endpoint.
- [x] Fixed character edit payload so description/trigger word can be cleared.
- [x] Fixed generation platform values to match shared API enums (`x`, `youtube_shorts`) and enabled suggestive v1 rating.
- [x] Fixed approval approve/reject requests to send JSON bodies accepted by Hono validation.
- [x] Added calendar manual export package creation/download flow plus mark-manually-posted action.
- [x] Fixed calendar grouping sort to use timestamps instead of localized label strings.

Verification:

- [x] `pnpm --filter @lumora/web test` (7 tests passed)
- [x] `pnpm --filter @lumora/web typecheck`
- [x] `pnpm test` (109 tests passed)
- [x] `pnpm typecheck` (all packages green)

Notes:

- `pnpm install --lockfile-only` updated lockfile for `@lumora/web` Vitest dev dependency.
- pnpm reports existing Pinia peer warning from Nuxt 4 / `@pinia/nuxt`; not introduced by this slice.

Next:

- [ ] Add richer frontend component tests for persona/upload/export edge cases.
- [ ] Replace campaign persona UUID input with persona selector.
- [ ] Add prompt-template selector/render preview to generation form.
- [ ] Add signed media previews to approvals by joining generation/gallery details.
