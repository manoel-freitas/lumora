import { z } from 'zod'

export const upsertInfluencerProfileSchema = z.object({
  characterId: z.string().uuid(),
  displayName: z.string().min(1).max(255),
  niche: z.string().optional(),
  audience: z.string().optional(),
  backstory: z.string().optional(),
  personalityTraits: z.array(z.string()).default([]),
  toneOfVoice: z.string().optional(),
  languages: z.array(z.string()).default(['en']),
  contentPillars: z.array(z.string()).default([]),
  visualStyle: z.string().optional(),
  boundaries: z.string().optional(),
  sfwPolicy: z.string().optional(),
  nsfwPolicy: z.string().optional(),
  disclosureNote: z.string().optional(),
})

export type UpsertInfluencerProfileInput = z.infer<typeof upsertInfluencerProfileSchema>
