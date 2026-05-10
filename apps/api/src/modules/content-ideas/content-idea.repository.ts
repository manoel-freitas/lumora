import { and, desc, eq } from 'drizzle-orm'
import type { UpdateContentIdeaInput } from '@lumora/shared'
import { db } from '../../infra/db'
import { contentCampaigns, contentIdeas } from '../../db/schema'

export async function listContentIdeas(workspaceId: string) {
  return db.query.contentIdeas.findMany({
    where: eq(contentIdeas.workspaceId, workspaceId),
    orderBy: [desc(contentIdeas.createdAt)],
  })
}

export async function findContentIdea(workspaceId: string, id: string) {
  return db.query.contentIdeas.findFirst({
    where: and(eq(contentIdeas.workspaceId, workspaceId), eq(contentIdeas.id, id)),
  })
}

export async function findIdeaCampaign(workspaceId: string, campaignId: string) {
  return db.query.contentCampaigns.findFirst({
    where: and(eq(contentCampaigns.workspaceId, workspaceId), eq(contentCampaigns.id, campaignId)),
  })
}

export async function updateContentIdea(workspaceId: string, id: string, data: UpdateContentIdeaInput) {
  const [idea] = await db.update(contentIdeas)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(contentIdeas.workspaceId, workspaceId), eq(contentIdeas.id, id)))
    .returning()
  return idea || null
}

export async function deleteContentIdea(workspaceId: string, id: string) {
  const [idea] = await db.delete(contentIdeas)
    .where(and(eq(contentIdeas.workspaceId, workspaceId), eq(contentIdeas.id, id)))
    .returning()
  return Boolean(idea)
}
