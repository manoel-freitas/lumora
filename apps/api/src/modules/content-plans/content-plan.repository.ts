import { and, desc, eq } from 'drizzle-orm'
import type { CreateContentPlanInput, UpdateContentPlanInput } from '@lumora/shared'
import { db } from '../../infra/db'
import { contentAssets, contentPlans } from '../../db/schema'

export async function approvedAssetBelongsToWorkspace(workspaceId: string, assetId: string) {
  const asset = await db.query.contentAssets.findFirst({
    where: and(eq(contentAssets.workspaceId, workspaceId), eq(contentAssets.id, assetId)),
  })
  return asset?.status === 'approved' ? asset : null
}

export async function listContentPlans(workspaceId: string) {
  return db.query.contentPlans.findMany({
    where: eq(contentPlans.workspaceId, workspaceId),
    orderBy: [desc(contentPlans.plannedFor), desc(contentPlans.createdAt)],
  })
}

export async function findContentPlan(workspaceId: string, id: string) {
  return db.query.contentPlans.findFirst({
    where: and(eq(contentPlans.workspaceId, workspaceId), eq(contentPlans.id, id)),
  })
}

export async function createContentPlan(workspaceId: string, data: CreateContentPlanInput | {
  contentAssetId: string
  platform: CreateContentPlanInput['platform']
  plannedFor?: string
  caption?: string
  hashtags?: string[]
  platformNotes?: string
}) {
  const [plan] = await db.insert(contentPlans).values({
    workspaceId,
    contentAssetId: data.contentAssetId,
    platform: data.platform,
    plannedFor: data.plannedFor ? new Date(data.plannedFor) : undefined,
    caption: data.caption,
    hashtags: data.hashtags ?? [],
    platformNotes: data.platformNotes,
  }).returning()
  return plan
}

export async function updateContentPlan(workspaceId: string, id: string, data: UpdateContentPlanInput) {
  const [plan] = await db.update(contentPlans)
    .set({
      contentAssetId: data.contentAssetId,
      platform: data.platform,
      plannedFor: data.plannedFor ? new Date(data.plannedFor) : undefined,
      caption: data.caption,
      hashtags: data.hashtags,
      platformNotes: data.platformNotes,
      updatedAt: new Date(),
    })
    .where(and(eq(contentPlans.workspaceId, workspaceId), eq(contentPlans.id, id)))
    .returning()
  return plan || null
}

export async function deleteContentPlan(workspaceId: string, id: string) {
  const [plan] = await db.delete(contentPlans)
    .where(and(eq(contentPlans.workspaceId, workspaceId), eq(contentPlans.id, id)))
    .returning()
  return Boolean(plan)
}

export async function markContentPlanStatus(workspaceId: string, id: string, status: 'exported' | 'manually_posted') {
  const [plan] = await db.update(contentPlans)
    .set({
      status,
      manuallyPostedAt: status === 'manually_posted' ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(contentPlans.workspaceId, workspaceId), eq(contentPlans.id, id)))
    .returning()
  return plan || null
}
