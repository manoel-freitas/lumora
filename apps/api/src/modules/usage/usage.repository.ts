import { and, eq, gte, sql } from 'drizzle-orm'
import { db } from '../../infra/db'
import { generationCosts, generations, usageQuotas } from '../../db/schema'

function monthStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

export async function getOrCreateUsageQuota(workspaceId: string) {
  const existing = await db.query.usageQuotas.findFirst({ where: eq(usageQuotas.workspaceId, workspaceId) })
  if (existing) return existing

  const [quota] = await db.insert(usageQuotas).values({ workspaceId }).returning()
  return quota
}

export async function updateUsageQuota(workspaceId: string, data: {
  monthlyImageLimit?: number
  monthlyVideoLimit?: number
  monthlySpendLimitUsd?: string
}) {
  const [quota] = await db.update(usageQuotas)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(usageQuotas.workspaceId, workspaceId))
    .returning()

  return quota || getOrCreateUsageQuota(workspaceId)
}

export async function getCurrentMonthUsage(workspaceId: string) {
  const start = monthStart()

  const [counts] = await db.select({
    images: sql<number>`count(*) filter (where ${generations.type} = 'image')::int`,
    videos: sql<number>`count(*) filter (where ${generations.type} = 'video')::int`,
    failedJobs: sql<number>`count(*) filter (where ${generations.status} = 'failed')::int`,
  })
    .from(generations)
    .where(and(eq(generations.workspaceId, workspaceId), gte(generations.createdAt, start)))

  const [costs] = await db.select({
    estimatedCostUsd: sql<string>`coalesce(sum(${generationCosts.estimatedCostUsd}), 0)::text`,
    actualCostUsd: sql<string>`coalesce(sum(${generationCosts.actualCostUsd}), 0)::text`,
  })
    .from(generationCosts)
    .where(and(eq(generationCosts.workspaceId, workspaceId), gte(generationCosts.createdAt, start)))

  return {
    images: counts?.images ?? 0,
    videos: counts?.videos ?? 0,
    failedJobs: counts?.failedJobs ?? 0,
    estimatedCostUsd: costs?.estimatedCostUsd ?? '0',
    actualCostUsd: costs?.actualCostUsd ?? '0',
  }
}

export async function assertUsageQuotaAllows(workspaceId: string, type: 'image' | 'video') {
  const [quota, usage] = await Promise.all([
    getOrCreateUsageQuota(workspaceId),
    getCurrentMonthUsage(workspaceId),
  ])

  if (type === 'image' && usage.images >= quota.monthlyImageLimit) {
    throw new Error('Monthly image generation quota exceeded')
  }

  if (type === 'video' && usage.videos >= quota.monthlyVideoLimit) {
    throw new Error('Monthly video generation quota exceeded')
  }

  if (Number(usage.estimatedCostUsd) >= Number(quota.monthlySpendLimitUsd)) {
    throw new Error('Monthly spend quota exceeded')
  }
}

export async function listGenerationCosts(workspaceId: string) {
  return db.query.generationCosts.findMany({ where: eq(generationCosts.workspaceId, workspaceId) })
}
