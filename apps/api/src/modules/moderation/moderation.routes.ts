import { Hono } from 'hono'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import type { AppEnv } from '../../infra/auth'
import { notFound, parseJson } from '../../infra/http'
import { db } from '../../infra/db'
import { generations } from '../../db/schema'
import { listModerationResultsForGeneration } from './moderation.repository'
import { persistPromptPrecheck, runPostGenerationModeration } from './moderation.service'

const checkPromptSchema = z.object({
  prompt: z.string().min(1),
  platform: z.enum(['instagram', 'tiktok', 'x', 'youtube_shorts', 'onlyfans', 'privacy', 'other']).default('instagram'),
  contentRating: z.enum(['sfw', 'suggestive', 'adult']).default('sfw'),
})

export const moderationRouter = new Hono<AppEnv>()

moderationRouter.post('/check-prompt', async (c) => {
  const input = await parseJson(c, checkPromptSchema)
  if (input instanceof Response) return input

  const result = await persistPromptPrecheck({
    workspaceId: c.get('workspaceId'),
    prompt: input.prompt,
    platform: input.platform ?? 'instagram',
    contentRating: input.contentRating ?? 'sfw',
  })
  return c.json(result)
})

moderationRouter.post('/check-generation/:id', async (c) => {
  const generation = await db.query.generations.findFirst({
    where: and(eq(generations.workspaceId, c.get('workspaceId')), eq(generations.id, c.req.param('id'))),
  })
  if (!generation) return notFound(c, 'Generation')

  const result = await runPostGenerationModeration(generation.id)
  return c.json(result)
})

moderationRouter.get('/generations/:id', async (c) => {
  const generation = await db.query.generations.findFirst({
    where: and(eq(generations.workspaceId, c.get('workspaceId')), eq(generations.id, c.req.param('id'))),
  })
  if (!generation) return notFound(c, 'Generation')

  const results = await listModerationResultsForGeneration(c.get('workspaceId'), generation.id)
  return c.json({ generationId: generation.id, results })
})
