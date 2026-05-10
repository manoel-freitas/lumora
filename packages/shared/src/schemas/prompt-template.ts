import { z } from 'zod'
import { contentRatingSchema, generationTypeSchema, platformSchema } from './common'

export const createPromptTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  platform: platformSchema,
  contentRating: contentRatingSchema.default('sfw'),
  mediaType: generationTypeSchema,
  template: z.string().min(1),
  negativePrompt: z.string().optional(),
  variables: z.array(z.string()).default([]),
})

export const updatePromptTemplateSchema = createPromptTemplateSchema.partial()
export const renderPromptTemplateSchema = z.object({ variables: z.record(z.any()).default({}) })

export type CreatePromptTemplateInput = z.infer<typeof createPromptTemplateSchema>
export type UpdatePromptTemplateInput = z.infer<typeof updatePromptTemplateSchema>
export type RenderPromptTemplateInput = z.infer<typeof renderPromptTemplateSchema>
