import { eq } from 'drizzle-orm'
import { db } from '../../infra/db'
import { generations } from '../../db/schema'
import { createModerationResult } from './moderation.repository'

export type ModerationResult = {
  rating: 'safe' | 'borderline' | 'rejected'
  detectedIssues: string[]
  suggestedFixes: string[]
}

const rejectedTerms = [
  'nude',
  'nudity',
  'explicit sex',
  'minor',
  'underage',
  'child',
  'genitals',
  'nipples',
  'porn',
]

const borderlineTerms = [
  'lingerie',
  'bikini',
  'swimwear',
  'sensual',
  'seductive',
  'cleavage',
]

export function runPromptPrecheck(input: { prompt?: string; platform?: string; contentRating?: string }): ModerationResult {
  const prompt = (input.prompt || '').toLowerCase()
  const detectedIssues = rejectedTerms.filter((term) => prompt.includes(term))

  if (input.contentRating === 'adult' && ['instagram', 'tiktok'].includes(input.platform || '')) {
    detectedIssues.push('adult content not allowed for platform')
  }

  if (detectedIssues.length) {
    return {
      rating: 'rejected',
      detectedIssues,
      suggestedFixes: ['Use clothed adult-coded SFW editorial framing.'],
    }
  }

  const borderlineIssues = borderlineTerms.filter((term) => prompt.includes(term))
  if (borderlineIssues.length) {
    return {
      rating: 'borderline',
      detectedIssues: borderlineIssues,
      suggestedFixes: ['Keep pose non-explicit, avoid sexual body-part focus, keep clothing clearly visible.'],
    }
  }

  return { rating: 'safe', detectedIssues: [], suggestedFixes: [] }
}

export async function persistPromptPrecheck(input: {
  workspaceId: string
  generationId?: string
  prompt: string
  platform: 'instagram' | 'tiktok' | 'x' | 'youtube_shorts' | 'onlyfans' | 'privacy' | 'other'
  contentRating: string
}) {
  const result = runPromptPrecheck(input)
  await createModerationResult({
    workspaceId: input.workspaceId,
    generationId: input.generationId,
    platform: input.platform,
    ...result,
    rawResult: { phase: 'prompt_precheck', prompt: input.prompt },
  })
  return result
}

export async function runPostGenerationModeration(generationId: string): Promise<ModerationResult> {
  const generation = await db.query.generations.findFirst({ where: eq(generations.id, generationId) })
  if (!generation) throw new Error(`Generation ${generationId} not found`)

  const result = runPromptPrecheck({
    prompt: generation.finalPrompt || generation.prompt,
    platform: generation.platform,
    contentRating: generation.contentRating,
  })

  await createModerationResult({
    workspaceId: generation.workspaceId,
    generationId,
    platform: generation.platform,
    ...result,
    rawResult: { phase: 'media_postcheck', scaffold: true },
  })

  return result
}
