import { z } from 'zod'
import { contentRatingSchema, generationTypeSchema, platformSchema } from './common'

export const createGenerationSchema = z.object({
  prompt: z.string().min(1),
  negativePrompt: z.string().optional(),
  type: generationTypeSchema,
  platform: platformSchema.default('instagram'),
  contentRating: contentRatingSchema.default('sfw'),
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

export type CreateGenerationInput = z.infer<typeof createGenerationSchema>
