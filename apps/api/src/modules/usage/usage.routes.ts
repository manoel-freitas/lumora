import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../../infra/auth'
import { parseJson } from '../../infra/http'
import { getCurrentMonthUsage, getOrCreateUsageQuota, listGenerationCosts, updateUsageQuota } from './usage.repository'

const updateQuotaSchema = z.object({
  monthlyImageLimit: z.number().int().min(0).optional(),
  monthlyVideoLimit: z.number().int().min(0).optional(),
  monthlySpendLimitUsd: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
})

export const usageRouter = new Hono<AppEnv>()

usageRouter.get('/current-month', async (c) => c.json(await getCurrentMonthUsage(c.get('workspaceId'))))
usageRouter.get('/costs', async (c) => c.json({ items: await listGenerationCosts(c.get('workspaceId')) }))
usageRouter.get('/quotas', async (c) => c.json(await getOrCreateUsageQuota(c.get('workspaceId'))))
usageRouter.put('/quotas', async (c) => {
  const input = await parseJson(c, updateQuotaSchema)
  if (input instanceof Response) return input
  return c.json(await updateUsageQuota(c.get('workspaceId'), input))
})
