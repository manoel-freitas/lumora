import { and, desc, eq, inArray } from 'drizzle-orm'
import { db } from '../../infra/db'
import { contentAssets } from '../../db/schema'

export async function listContentAssets(workspaceId: string) {
  return db.query.contentAssets.findMany({
    where: eq(contentAssets.workspaceId, workspaceId),
    orderBy: [desc(contentAssets.createdAt)],
  })
}

export async function listApprovalQueue(workspaceId: string) {
  return db.query.contentAssets.findMany({
    where: and(
      eq(contentAssets.workspaceId, workspaceId),
      inArray(contentAssets.status, ['generated', 'reviewed']),
    ),
    orderBy: [desc(contentAssets.createdAt)],
  })
}

export async function findContentAsset(workspaceId: string, id: string) {
  return db.query.contentAssets.findFirst({
    where: and(eq(contentAssets.workspaceId, workspaceId), eq(contentAssets.id, id)),
  })
}

export async function updateContentAsset(workspaceId: string, id: string, data: { notes?: string }) {
  const [asset] = await db.update(contentAssets)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(contentAssets.workspaceId, workspaceId), eq(contentAssets.id, id)))
    .returning()
  return asset || null
}

export async function transitionContentAsset(workspaceId: string, id: string, status: 'reviewed' | 'approved' | 'rejected', notes?: string) {
  const [asset] = await db.update(contentAssets)
    .set({ status, notes, updatedAt: new Date() })
    .where(and(eq(contentAssets.workspaceId, workspaceId), eq(contentAssets.id, id)))
    .returning()
  return asset || null
}
