import { z } from 'zod'

export const createCharacterSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  triggerWord: z.string().max(100).optional(),
  isAdult: z.boolean().default(true),
  displayName: z.string().max(255).optional(),
  niche: z.string().max(255).optional(),
  audience: z.string().optional(),
  backstory: z.string().optional(),
  personalityTraits: z.array(z.string()).optional(),
  toneOfVoice: z.string().optional(),
  languages: z.array(z.string()).optional(),
  contentPillars: z.array(z.string()).optional(),
  visualStyle: z.string().optional(),
  boundaries: z.string().optional(),
  sfwPolicy: z.string().optional(),
  nsfwPolicy: z.string().optional(),
  disclosureNote: z.string().optional(),
})

export const updateCharacterSchema = createCharacterSchema.partial()

export type CreateCharacterInput = z.infer<typeof createCharacterSchema>
export type UpdateCharacterInput = z.infer<typeof updateCharacterSchema>
