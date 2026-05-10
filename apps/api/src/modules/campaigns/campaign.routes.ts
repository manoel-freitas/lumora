import { Hono } from 'hono'
import { createCampaignSchema, createContentIdeaSchema, createGenerationSchema, type CreateGenerationInput } from '@lumora/shared'
import type { AppEnv } from '../../infra/auth'
import { notFound, parseJson } from '../../infra/http'
import { createGeneration } from '../generations/generation.service'
import {
  createCampaign,
  createCampaignIdea,
  deleteCampaign,
  findCampaign,
  listCampaigns,
  personaBelongsToWorkspace,
  updateCampaign,
} from './campaign.repository'

export const campaignsRouter = new Hono<AppEnv>()

campaignsRouter.get('/', async (c) => c.json({ items: await listCampaigns(c.get('workspaceId')) }))

campaignsRouter.post('/', async (c) => {
  const input = await parseJson(c, createCampaignSchema)
  if (input instanceof Response) return input

  const personaExists = await personaBelongsToWorkspace(c.get('workspaceId'), input.influencerProfileId)
  if (!personaExists) return notFound(c, 'Persona')

  return c.json(await createCampaign(c.get('workspaceId'), input), 201)
})

campaignsRouter.get('/:id', async (c) => {
  const campaign = await findCampaign(c.get('workspaceId'), c.req.param('id'))
  if (!campaign) return notFound(c, 'Campaign')
  return c.json(campaign)
})

campaignsRouter.put('/:id', async (c) => {
  const input = await parseJson(c, createCampaignSchema.partial())
  if (input instanceof Response) return input

  if (input.influencerProfileId) {
    const personaExists = await personaBelongsToWorkspace(c.get('workspaceId'), input.influencerProfileId)
    if (!personaExists) return notFound(c, 'Persona')
  }

  const campaign = await updateCampaign(c.get('workspaceId'), c.req.param('id'), input)
  if (!campaign) return notFound(c, 'Campaign')
  return c.json(campaign)
})

campaignsRouter.delete('/:id', async (c) => {
  const deleted = await deleteCampaign(c.get('workspaceId'), c.req.param('id'))
  if (!deleted) return notFound(c, 'Campaign')
  return c.json({ deleted: true })
})

campaignsRouter.post('/:id/ideas', async (c) => {
  const campaign = await findCampaign(c.get('workspaceId'), c.req.param('id'))
  if (!campaign) return notFound(c, 'Campaign')

  const input = await parseJson(c, createContentIdeaSchema)
  if (input instanceof Response) return input

  return c.json(await createCampaignIdea(c.get('workspaceId'), campaign.id, input), 201)
})

campaignsRouter.post('/:id/generate-ideas', async (c) => {
  const campaign = await findCampaign(c.get('workspaceId'), c.req.param('id'))
  if (!campaign) return notFound(c, 'Campaign')

  const idea = await createCampaignIdea(c.get('workspaceId'), campaign.id, {
    title: `${campaign.name} content idea`,
    description: campaign.goal || 'Campaign content idea generated from campaign brief.',
    hook: 'POV: your soft life era starts tonight.',
    captionDraft: 'Golden hour, clear mind, high standards.',
    hashtags: ['#virtualinfluencer', '#fashionportrait', '#luxurylifestyle'],
    platform: campaign.platform,
  })

  return c.json({ items: [idea] }, 201)
})

campaignsRouter.post('/:id/generate-assets', async (c) => {
  const campaign = await findCampaign(c.get('workspaceId'), c.req.param('id'))
  if (!campaign) return notFound(c, 'Campaign')

  const body = await c.req.json().catch(() => ({}))
  const baseInput = createGenerationSchema.partial().parse(body)
  const prompt = baseInput.prompt || campaign.ideas[0]?.description || campaign.goal || campaign.name

  const generationInput: CreateGenerationInput = {
    prompt,
    type: baseInput.type || 'image',
    platform: baseInput.platform || campaign.platform,
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
