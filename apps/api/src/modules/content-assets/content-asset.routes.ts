import { Hono } from 'hono'
import { z } from 'zod'
import { approveAssetSchema, rejectAssetSchema, reviewAssetSchema } from '@lumora/shared'
import type { AppEnv } from '../../infra/auth'
import { notFound, parseJson } from '../../infra/http'
import { findContentAsset, listContentAssets, transitionContentAsset, updateContentAsset } from './content-asset.repository'

const updateAssetSchema = z.object({ notes: z.string().optional() })

export const contentAssetsRouter = new Hono<AppEnv>()

contentAssetsRouter.get('/', async (c) => c.json({ items: await listContentAssets(c.get('workspaceId')) }))

contentAssetsRouter.get('/:id', async (c) => {
  const asset = await findContentAsset(c.get('workspaceId'), c.req.param('id'))
  if (!asset) return notFound(c, 'Asset')
  return c.json(asset)
})

contentAssetsRouter.put('/:id', async (c) => {
  const input = await parseJson(c, updateAssetSchema)
  if (input instanceof Response) return input

  const asset = await updateContentAsset(c.get('workspaceId'), c.req.param('id'), input)
  if (!asset) return notFound(c, 'Asset')
  return c.json(asset)
})

contentAssetsRouter.post('/:id/review', async (c) => {
  const input = await parseJson(c, reviewAssetSchema)
  if (input instanceof Response) return input

  const asset = await transitionContentAsset(c.get('workspaceId'), c.req.param('id'), 'reviewed', input.notes)
  if (!asset) return notFound(c, 'Asset')
  return c.json(asset)
})

contentAssetsRouter.post('/:id/approve', async (c) => {
  const input = await parseJson(c, approveAssetSchema)
  if (input instanceof Response) return input

  const asset = await transitionContentAsset(c.get('workspaceId'), c.req.param('id'), 'approved', input.notes)
  if (!asset) return notFound(c, 'Asset')
  return c.json(asset)
})

contentAssetsRouter.post('/:id/reject', async (c) => {
  const input = await parseJson(c, rejectAssetSchema)
  if (input instanceof Response) return input

  const asset = await transitionContentAsset(c.get('workspaceId'), c.req.param('id'), 'rejected', input.notes)
  if (!asset) return notFound(c, 'Asset')
  return c.json(asset)
})
