import 'dotenv/config'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { bodyLimit } from 'hono/body-limit'
import { logger } from 'hono/logger'

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
import { requireAuth, requireWorkspace, type AppEnv } from './infra/auth'

export const app = new Hono<AppEnv>()

app.use('*', logger())
app.use('*', cors({
  origin: process.env.WEB_URL || 'http://localhost:3000',
  credentials: true,
}))

// Hard ceiling on any body. Storage uploads validate finer-grained limits in the service.
app.use('*', bodyLimit({
  maxSize: 15 * 1024 * 1024,
  onError: (c) => c.json({ error: 'Payload too large' }, 413),
}))

app.get('/health', (c) => c.json({ status: 'ok' }))

app.route('/auth', authRouter)

for (const path of ['/workspaces']) {
  app.use(path, requireAuth)
  app.use(`${path}/*`, requireAuth)
}

for (const path of [
  '/characters',
  '/personas',
  '/campaigns',
  '/content-ideas',
  '/assets',
  '/content-plans',
  '/exports',
  '/approvals',
  '/moderation',
  '/prompt-templates',
  '/gallery',
  '/generations',
  '/storage',
  '/usage',
]) {
  app.use(path, requireAuth, requireWorkspace)
  app.use(`${path}/*`, requireAuth, requireWorkspace)
}

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
