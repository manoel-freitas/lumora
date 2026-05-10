import { and, desc, eq } from 'drizzle-orm'
import { db } from '../../infra/db'
import { moderationResults } from '../../db/schema'

export type ModerationRating = 'safe' | 'borderline' | 'rejected'

export async function createModerationResult(input: {
  workspaceId: string
  generationId?: string
  contentAssetId?: string
  platform: 'instagram' | 'tiktok' | 'x' | 'youtube_shorts' | 'onlyfans' | 'privacy' | 'other'
  rating: ModerationRating
  detectedIssues: string[]
  suggestedFixes: string[]
  rawResult?: unknown
}) {
  const [result] = await db.insert(moderationResults).values({
    workspaceId: input.workspaceId,
    generationId: input.generationId,
    contentAssetId: input.contentAssetId,
    platform: input.platform,
    rating: input.rating,
    detectedIssues: input.detectedIssues,
    suggestedFixes: input.suggestedFixes,
    rawResult: input.rawResult as Record<string, unknown> | undefined,
  }).returning()

  return result
}

export async function listModerationResultsForGeneration(workspaceId: string, generationId: string) {
  return db.query.moderationResults.findMany({
    where: and(eq(moderationResults.workspaceId, workspaceId), eq(moderationResults.generationId, generationId)),
    orderBy: [desc(moderationResults.createdAt)],
  })
}
