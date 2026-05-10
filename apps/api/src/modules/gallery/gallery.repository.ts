import { and, desc, eq, sql, type SQL } from 'drizzle-orm'
import { db } from '../../infra/db'
import { characters, contentAssets, contentCampaigns, generations, moderationResults } from '../../db/schema'

export type GalleryFilters = {
  page?: number
  limit?: number
  characterId?: string
  campaignId?: string
  type?: 'image' | 'video'
  platform?: 'instagram' | 'tiktok' | 'x' | 'youtube_shorts' | 'onlyfans' | 'privacy' | 'other'
  contentRating?: 'sfw' | 'suggestive' | 'adult'
  moderationRating?: 'safe' | 'borderline' | 'rejected'
  approvalStatus?: 'generated' | 'reviewed' | 'approved' | 'rejected' | 'scheduled' | 'published'
}

function whereClauses(workspaceId: string, filters: GalleryFilters) {
  const clauses: SQL[] = [eq(generations.workspaceId, workspaceId)]
  clauses.push(eq(generations.status, 'completed'))
  if (filters.characterId) clauses.push(eq(generations.characterId, filters.characterId))
  if (filters.campaignId) clauses.push(eq(generations.campaignId, filters.campaignId))
  if (filters.type) clauses.push(eq(generations.type, filters.type))
  if (filters.platform) clauses.push(eq(generations.platform, filters.platform))
  if (filters.contentRating) clauses.push(eq(generations.contentRating, filters.contentRating))
  if (filters.moderationRating) clauses.push(eq(moderationResults.rating, filters.moderationRating))
  if (filters.approvalStatus) clauses.push(eq(contentAssets.status, filters.approvalStatus))
  return clauses
}

export async function listGallery(workspaceId: string, filters: GalleryFilters) {
  const page = Math.max(filters.page || 1, 1)
  const limit = Math.min(Math.max(filters.limit || 20, 1), 100)
  const offset = (page - 1) * limit
  const clauses = whereClauses(workspaceId, filters)

  const items = await db.select({
    generation: generations,
    asset: contentAssets,
    character: characters,
    campaign: contentCampaigns,
    moderation: moderationResults,
  })
    .from(generations)
    .leftJoin(contentAssets, eq(contentAssets.generationId, generations.id))
    .leftJoin(characters, eq(characters.id, generations.characterId))
    .leftJoin(contentCampaigns, eq(contentCampaigns.id, generations.campaignId))
    .leftJoin(moderationResults, eq(moderationResults.generationId, generations.id))
    .where(and(...clauses))
    .orderBy(desc(generations.createdAt))
    .limit(limit)
    .offset(offset)

  const [countRow] = await db.select({ total: sql<number>`count(distinct ${generations.id})::int` })
    .from(generations)
    .leftJoin(contentAssets, eq(contentAssets.generationId, generations.id))
    .leftJoin(moderationResults, eq(moderationResults.generationId, generations.id))
    .where(and(...clauses))

  return { items, total: countRow?.total ?? 0, page, limit }
}

export async function findGalleryItem(workspaceId: string, id: string) {
  const [item] = await db.select({
    generation: generations,
    asset: contentAssets,
    character: characters,
    campaign: contentCampaigns,
    moderation: moderationResults,
  })
    .from(generations)
    .leftJoin(contentAssets, eq(contentAssets.generationId, generations.id))
    .leftJoin(characters, eq(characters.id, generations.characterId))
    .leftJoin(contentCampaigns, eq(contentCampaigns.id, generations.campaignId))
    .leftJoin(moderationResults, eq(moderationResults.generationId, generations.id))
    .where(and(eq(generations.workspaceId, workspaceId), eq(generations.id, id)))
    .limit(1)

  return item || null
}

export async function deleteGalleryItem(workspaceId: string, id: string) {
  const [generation] = await db.delete(generations)
    .where(and(eq(generations.workspaceId, workspaceId), eq(generations.id, id)))
    .returning()
  return generation || null
}
