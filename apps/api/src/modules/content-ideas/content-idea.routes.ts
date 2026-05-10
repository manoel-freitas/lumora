import { Hono } from 'hono'
import { createGenerationSchema, updateContentIdeaSchema, type CreateGenerationInput } from '@lumora/shared'
import type { AppEnv } from '../../infra/auth'
import { notFound, parseJson } from '../../infra/http'
import { createGeneration } from '../generations/generation.service'
import { deleteContentIdea, findContentIdea, findIdeaCampaign, listContentIdeas, updateContentIdea } from './content-idea.repository'

export const contentIdeasRouter = new Hono<AppEnv>()

contentIdeasRouter.get('/', async (c) => c.json({ items: await listContentIdeas(c.get('workspaceId')) }))

contentIdeasRouter.get('/:id', async (c) => {
  const idea = await findContentIdea(c.get('workspaceId'), c.req.param('id'))
  if (!idea) return notFound(c, 'Content idea')
  return c.json(idea)
})

contentIdeasRouter.put('/:id', async (c) => {
  const input = await parseJson(c, updateContentIdeaSchema)
  if (input instanceof Response) return input

  const idea = await updateContentIdea(c.get('workspaceId'), c.req.param('id'), input)
  if (!idea) return notFound(c, 'Content idea')
  return c.json(idea)
})

contentIdeasRouter.delete('/:id', async (c) => {
  const deleted = await deleteContentIdea(c.get('workspaceId'), c.req.param('id'))
  if (!deleted) return notFound(c, 'Content idea')
  return c.json({ deleted: true })
})

contentIdeasRouter.post('/:id/generate', async (c) => {
  const idea = await findContentIdea(c.get('workspaceId'), c.req.param('id'))
  if (!idea) return notFound(c, 'Content idea')

  const campaign = await findIdeaCampaign(c.get('workspaceId'), idea.campaignId)
  if (!campaign) return notFound(c, 'Campaign')

  const body = await c.req.json().catch(() => ({}))
  const baseInput = createGenerationSchema.partial().parse(body)
  const generationInput: CreateGenerationInput = {
    prompt: baseInput.prompt || idea.description || idea.title,
    negativePrompt: baseInput.negativePrompt,
    type: baseInput.type || 'image',
    platform: baseInput.platform || idea.platform,
    contentRating: baseInput.contentRating || campaign.contentRating,
    influencerProfileId: campaign.influencerProfileId,
    campaignId: campaign.id,
    promptTemplateId: baseInput.promptTemplateId,
    templateVariables: baseInput.templateVariables,
    width: baseInput.width || 1024,
    height: baseInput.height || 1024,
    duration: baseInput.duration || 5,
  }

  try {
    const generation = await createGeneration(c.get('workspaceId'), generationInput)
    return c.json(generation, 201)
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Generation failed' }, 400)
  }
})
