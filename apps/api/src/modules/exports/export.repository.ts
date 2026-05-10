import { and, desc, eq } from 'drizzle-orm'
import type { CreateExportPackageInput } from '@lumora/shared'
import { db } from '../../infra/db'
import { contentAssets, contentPlans, exportPackages } from '../../db/schema'

export const defaultSafetyChecklist = [
  'No nudity',
  'No explicit pose',
  'Character clearly appears adult',
  'Caption is SFW',
  'Hashtags are platform-safe',
  'No real-person likeness issue',
  'Ready for manual posting',
]

export async function listExportPackages(workspaceId: string) {
  return db.query.exportPackages.findMany({
    where: eq(exportPackages.workspaceId, workspaceId),
    orderBy: [desc(exportPackages.createdAt)],
  })
}

export async function findExportPackage(workspaceId: string, id: string) {
  return db.query.exportPackages.findFirst({
    where: and(eq(exportPackages.workspaceId, workspaceId), eq(exportPackages.id, id)),
  })
}

export async function findApprovedAsset(workspaceId: string, assetId: string) {
  const asset = await db.query.contentAssets.findFirst({
    where: and(eq(contentAssets.workspaceId, workspaceId), eq(contentAssets.id, assetId)),
  })
  return asset?.status === 'approved' ? asset : null
}

export async function findPlan(workspaceId: string, planId: string) {
  return db.query.contentPlans.findFirst({
    where: and(eq(contentPlans.workspaceId, workspaceId), eq(contentPlans.id, planId)),
  })
}

export async function createExportPackage(workspaceId: string, data: CreateExportPackageInput | {
  contentAssetId: string
  contentPlanId?: string
  platform: CreateExportPackageInput['platform']
  caption?: string
  hashtags?: string[]
  platformNotes?: string
}) {
  const [pkg] = await db.insert(exportPackages).values({
    workspaceId,
    contentAssetId: data.contentAssetId,
    contentPlanId: data.contentPlanId,
    platform: data.platform,
    caption: data.caption,
    hashtags: data.hashtags ?? [],
    platformNotes: data.platformNotes,
    checklist: defaultSafetyChecklist,
    metadata: { manualExportOnly: true, generatedAt: new Date().toISOString() },
  }).returning()
  return pkg
}

export async function markExportDownloaded(workspaceId: string, id: string) {
  const [pkg] = await db.update(exportPackages)
    .set({ status: 'downloaded', downloadedAt: new Date() })
    .where(and(eq(exportPackages.workspaceId, workspaceId), eq(exportPackages.id, id)))
    .returning()
  return pkg || null
}

export async function archiveExportPackage(workspaceId: string, id: string) {
  const [pkg] = await db.update(exportPackages)
    .set({ status: 'archived' })
    .where(and(eq(exportPackages.workspaceId, workspaceId), eq(exportPackages.id, id)))
    .returning()
  return pkg || null
}
