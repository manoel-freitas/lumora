import { z } from 'zod'

export const createCharacterSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  triggerWord: z.string().max(100).optional(),
  isAdult: z.boolean().default(true),
})

export const updateCharacterSchema = createCharacterSchema.partial()

export type CreateCharacterInput = z.infer<typeof createCharacterSchema>
export type UpdateCharacterInput = z.infer<typeof updateCharacterSchema>
