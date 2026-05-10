import { z } from 'zod'
import { platformSchema } from './common'

export const createContentPlanSchema = z.object({
  contentAssetId: z.string().uuid(),
  platform: platformSchema,
  plannedFor: z.string().datetime().optional(),
  caption: z.string().optional(),
  hashtags: z.array(z.string()).default([]),
  platformNotes: z.string().optional(),
})

export const updateContentPlanSchema = createContentPlanSchema.partial()

export const createExportPackageSchema = z.object({
  contentAssetId: z.string().uuid(),
  contentPlanId: z.string().uuid().optional(),
  platform: platformSchema,
  caption: z.string().optional(),
  hashtags: z.array(z.string()).default([]),
  platformNotes: z.string().optional(),
})

export type CreateContentPlanInput = z.infer<typeof createContentPlanSchema>
export type UpdateContentPlanInput = z.infer<typeof updateContentPlanSchema>
export type CreateExportPackageInput = z.infer<typeof createExportPackageSchema>
