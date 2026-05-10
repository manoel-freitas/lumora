import { Hono } from 'hono'
import { createContentPlanSchema, updateContentPlanSchema } from '@lumora/shared'
import type { AppEnv } from '../../infra/auth'
import { notFound, parseJson } from '../../infra/http'
import {
  approvedAssetBelongsToWorkspace,
  createContentPlan,
  deleteContentPlan,
  findContentPlan,
  listContentPlans,
  markContentPlanStatus,
  updateContentPlan,
} from './content-plan.repository'

export const contentPlansRouter = new Hono<AppEnv>()

contentPlansRouter.get('/', async (c) => c.json({ items: await listContentPlans(c.get('workspaceId')) }))

contentPlansRouter.post('/', async (c) => {
  const input = await parseJson(c, createContentPlanSchema)
  if (input instanceof Response) return input

  const asset = await approvedAssetBelongsToWorkspace(c.get('workspaceId'), input.contentAssetId)
  if (!asset) return c.json({ error: 'Approved asset required' }, 400)

  return c.json(await createContentPlan(c.get('workspaceId'), input), 201)
})

contentPlansRouter.get('/:id', async (c) => {
  const plan = await findContentPlan(c.get('workspaceId'), c.req.param('id'))
  if (!plan) return notFound(c, 'Content plan')
  return c.json(plan)
})

contentPlansRouter.put('/:id', async (c) => {
  const input = await parseJson(c, updateContentPlanSchema)
  if (input instanceof Response) return input

  if (input.contentAssetId) {
    const asset = await approvedAssetBelongsToWorkspace(c.get('workspaceId'), input.contentAssetId)
    if (!asset) return c.json({ error: 'Approved asset required' }, 400)
  }

  const plan = await updateContentPlan(c.get('workspaceId'), c.req.param('id'), input)
  if (!plan) return notFound(c, 'Content plan')
  return c.json(plan)
})

contentPlansRouter.delete('/:id', async (c) => {
  const deleted = await deleteContentPlan(c.get('workspaceId'), c.req.param('id'))
  if (!deleted) return notFound(c, 'Content plan')
  return c.json({ deleted: true })
})

contentPlansRouter.post('/:id/mark-exported', async (c) => {
  const plan = await markContentPlanStatus(c.get('workspaceId'), c.req.param('id'), 'exported')
  if (!plan) return notFound(c, 'Content plan')
  return c.json(plan)
})

contentPlansRouter.post('/:id/mark-manually-posted', async (c) => {
  const plan = await markContentPlanStatus(c.get('workspaceId'), c.req.param('id'), 'manually_posted')
  if (!plan) return notFound(c, 'Content plan')
  return c.json(plan)
})
