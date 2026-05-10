import { z } from 'zod'
import { contentRatingSchema, platformSchema } from './common'

export const createCampaignSchema = z.object({
  influencerProfileId: z.string().uuid(),
  name: z.string().min(1).max(255),
  goal: z.string().optional(),
  platform: platformSchema,
  contentRating: contentRatingSchema.default('sfw'),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
})

export const updateCampaignSchema = createCampaignSchema.partial()

export const createContentIdeaSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  hook: z.string().optional(),
  captionDraft: z.string().optional(),
  hashtags: z.array(z.string()).default([]),
  platform: platformSchema,
})

export const updateContentIdeaSchema = createContentIdeaSchema.partial().extend({
  status: z.string().max(50).optional(),
})

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>
export type CreateContentIdeaInput = z.infer<typeof createContentIdeaSchema>
export type UpdateContentIdeaInput = z.infer<typeof updateContentIdeaSchema>
