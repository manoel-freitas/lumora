# Lumora

**AI influencer content studio.** Create consistent virtual influencers, generate safe-for-work media, plan campaigns, review content, and export ready-to-post packages — without connecting to any social platform.

> [!NOTE]
> Lumora v1 uses **manual export only**. No social API integrations, no auto-posting. Export a ZIP, post it yourself.

---

## What is Lumora?

Lumora is not just an image generator. It is a repeatable workflow for running an AI social influencer:

1. **Create a character** — define visual identity, trigger word, and reference photos.
2. **Build a persona** — niche, tone of voice, content pillars, backstory, and platform policy.
3. **Plan campaigns** — organize content ideas around a goal, platform, and schedule.
4. **Generate media** — async image/video generation with character consistency via fal.ai and Together AI.
5. **Review and approve** — moderation queue checks prompt safety and flags platform policy violations before and after generation.
6. **Export** — download a ZIP with media, caption, hashtags, platform notes, and a safety checklist ready for manual posting.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Nuxt 4, Vue 3, Tailwind CSS, Pinia |
| Backend | Hono, Drizzle ORM, PostgreSQL |
| Queue | BullMQ + Redis |
| Storage | Cloudflare R2 |
| Image AI | Together AI (`FLUX.1-schnell`), fal.ai (`ip-adapter-face-id`) |
| Video AI | fal.ai (`kling-video/v1.6`) |
| Deployment | Railway (Nixpacks) |
| Monorepo | pnpm workspaces + Turborepo |

---

## Monorepo Structure

```
lumora/
├── apps/
│   ├── web/          # Nuxt 4 frontend
│   └── api/          # Hono REST API + BullMQ worker
└── packages/
    └── shared/       # Zod schemas and shared types
```

The API follows a `modules/<domain>` layout with thin route handlers delegating to services and repositories. The worker runs as a separate process and handles async generation jobs.

---

## Getting Started

### Prerequisites

- Node.js 22+ and pnpm 9+
- Docker + Docker Compose (for local infra)

### Option A — Local apps + Docker infra (recommended)

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL and Redis
docker compose -f docker-compose.infra.yml up -d

# 3. Copy and configure env
cp .env.example .env
# Edit .env — DB/Redis already wired to docker defaults, add API keys

# 4. Run migrations
pnpm db:migrate

# 5. (Optional) Seed
pnpm db:seed

# 6. Start dev servers
pnpm dev
```

Frontend → `http://localhost:3000` · API → `http://localhost:3001`

### Option B — Full Docker Compose stack

```bash
cp .env.example .env
# Edit .env with your API keys (DB/Redis auto-wired)

docker compose up --build
```

All services start with hot-reload volumes mounted. Same ports apply.

> **Note:** External services (Together AI, fal.ai, Cloudflare R2) always require real API keys — no local mocks.

### Running tests

```bash
# All packages
pnpm test

# Single package
pnpm --filter @lumora/api test
pnpm --filter @lumora/web test
```

### Type checking

```bash
pnpm typecheck
```

---

## Environment Variables

Copy `.env.example` and fill in the values:

```bash
# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/lumora

# Redis connection string
REDIS_URL=redis://localhost:6379

# AI providers
TOGETHER_AI_API_KEY=
FAL_KEY=

# Cloudflare R2 storage
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=lumora
R2_PUBLIC_URL=https://pub-xxxx.r2.dev
R2_PRIVATE_BUCKET_NAME=lumora-private

# Auth
JWT_SECRET=
AUTH_COOKIE_NAME=lumora_session

# Service URLs
API_PORT=3001
API_URL=http://localhost:3001
WEB_URL=http://localhost:3000
HONO_API_URL=http://localhost:3001

# Feature flags (default: off)
ENABLE_ADULT_MODE=false
ENABLE_SOCIAL_INTEGRATIONS=false
```

> [!WARNING]
> `ENABLE_ADULT_MODE=true` requires additional workspace-level consent and audit controls. Adult content is blocked by default and rejected on SFW-only platforms (Instagram, TikTok) regardless of this flag.

---

## Content Policy

Lumora v1 enforces SFW/suggestive-but-not-explicit content by default.

**Allowed:** fashion portraits, editorial portraits, fitness/lifestyle, beauty/glamour, non-explicit beachwear, sensual clothed poses, dance/trend videos, luxury/travel lifestyle.

**Blocked:** nudity, explicit poses, visible genitals or nipples, pornographic framing, minors or ambiguous-age characters, real-person deepfakes without consent.

Moderation runs at two stages: prompt pre-check before generation, and media post-check after the worker completes.

---

## Export Packages

Every approved asset can be exported as a downloadable ZIP:

```
media/
  image-or-video.ext
caption.txt
hashtags.txt
platform-notes.txt
safety-checklist.txt
metadata.json
```

---

## API Modules

| Module | Responsibility |
|---|---|
| `auth` | JWT-based login, session, current user |
| `workspaces` | Multi-workspace isolation, membership |
| `characters` | Visual identity, reference photos, trigger word |
| `personas` | Influencer persona, niche, content pillars |
| `campaigns` | Content campaigns per persona and platform |
| `content-ideas` | Briefs before media generation |
| `generations` | Async media generation jobs |
| `moderation` | Prompt and media safety checks |
| `content-assets` | Approval lifecycle for generated media |
| `content-plans` | Scheduling and caption planning |
| `exports` | ZIP package generation and download |
| `gallery` | Paginated view across all generations |
| `storage` | Signed URL access to private R2 media |
| `usage` | Quota tracking and cost recording |

---

## Database

Drizzle ORM with PostgreSQL. Migrations are stored in `apps/api/src/db/migrations/`.

```bash
# Generate a new migration from schema changes
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Open Drizzle Studio
pnpm db:studio
```

---

## Deployment

The project is configured for Railway using Nixpacks. Each service (`web`, `api`, `worker`) deploys independently.

The worker (`apps/api/worker.ts`) runs as a separate Railway service alongside the API. It pulls jobs from the BullMQ `generations` queue and handles AI generation, R2 upload, moderation, cost recording, and asset creation.

> [!IMPORTANT]
> Never store private or adult content in public R2 paths. The worker enforces private visibility for all generated media. Signed URLs are used for access.

---

## v1 Boundaries

These features are intentionally out of scope for v1:

- Social OAuth or direct publishing (Instagram, TikTok, X, OnlyFans)
- Auto-posting via Postiz, Ayrshare, or any third-party scheduler
- Adult/private content workflows (gated behind feature flag + workspace opt-in + audit controls not yet built)
