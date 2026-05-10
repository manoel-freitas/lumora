import { Hono } from 'hono'
import { createGenerationSchema } from '@lumora/shared'
import type { AppEnv } from '../../infra/auth'
import { notFound, parseJson } from '../../infra/http'
import { createGeneration } from './generation.service'
import { findGeneration, listGenerations, updateGenerationStatus } from './generation.repository'

export const generationsRouter = new Hono<AppEnv>()

generationsRouter.get('/', async (c) => {
  return c.json({ items: await listGenerations(c.get('workspaceId')) })
})

generationsRouter.post('/', async (c) => {
  const input = await parseJson(c, createGenerationSchema)
  if (input instanceof Response) return input

  try {
    const generation = await createGeneration(c.get('workspaceId'), {
      ...input,
      platform: input.platform ?? 'instagram',
      contentRating: input.contentRating ?? 'sfw',
      width: input.width ?? 1024,
      height: input.height ?? 1024,
      duration: input.duration ?? 5,
    })
    return c.json(generation, 201)
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Generation failed' }, 400)
  }
})

generationsRouter.get('/:id', async (c) => {
  const generation = await findGeneration(c.get('workspaceId'), c.req.param('id'))
  if (!generation) return notFound(c, 'Generation')
  return c.json(generation)
})

generationsRouter.post('/:id/cancel', async (c) => {
  const generation = await updateGenerationStatus(c.get('workspaceId'), c.req.param('id'), 'cancelled')
  if (!generation) return notFound(c, 'Generation')
  return c.json(generation)
})

generationsRouter.post('/:id/regenerate', async (c) => {
  const generation = await findGeneration(c.get('workspaceId'), c.req.param('id'))
  if (!generation) return notFound(c, 'Generation')

  try {
    const regenerated = await createGeneration(c.get('workspaceId'), {
      prompt: generation.prompt,
      negativePrompt: generation.negativePrompt || undefined,
      type: generation.type,
      platform: generation.platform,
      contentRating: generation.contentRating,
      characterId: generation.characterId || undefined,
      campaignId: generation.campaignId || undefined,
      promptTemplateId: generation.promptTemplateId || undefined,
      templateVariables: {},
      width: generation.width || 1024,
      height: generation.height || 1024,
      duration: generation.duration || 5,
    })
    return c.json(regenerated, 201)
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Regeneration failed' }, 400)
  }
})
