import { db } from '../../infra/db'
import { contentAssets, generations } from '../../db/schema'
import { eq } from 'drizzle-orm'

export async function createContentAssetFromGeneration(generationId: string, safetyRating: 'safe' | 'borderline') {
  const generation = await db.query.generations.findFirst({ where: eq(generations.id, generationId) })
  if (!generation) throw new Error(`Generation ${generationId} not found`)

  const [asset] = await db.insert(contentAssets).values({
    workspaceId: generation.workspaceId,
    campaignId: generation.campaignId,
    generationId,
    assetType: generation.type,
    platform: generation.platform,
    contentRating: generation.contentRating,
    safetyRating,
  }).returning()

  return asset
}
