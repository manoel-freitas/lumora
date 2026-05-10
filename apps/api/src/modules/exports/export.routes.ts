import { Hono } from 'hono'
import { createExportPackageSchema } from '@lumora/shared'
import type { AppEnv } from '../../infra/auth'
import { notFound, parseJson } from '../../infra/http'
import {
  archiveExportPackage,
  createExportPackage,
  findApprovedAsset,
  findExportPackage,
  findPlan,
  listExportPackages,
  markExportDownloaded,
} from './export.repository'

export const exportsRouter = new Hono<AppEnv>()

exportsRouter.get('/', async (c) => c.json({ items: await listExportPackages(c.get('workspaceId')) }))

exportsRouter.post('/', async (c) => {
  const input = await parseJson(c, createExportPackageSchema)
  if (input instanceof Response) return input

  const asset = await findApprovedAsset(c.get('workspaceId'), input.contentAssetId)
  if (!asset) return c.json({ error: 'Approved asset required' }, 400)

  if (input.contentPlanId) {
    const plan = await findPlan(c.get('workspaceId'), input.contentPlanId)
    if (!plan) return notFound(c, 'Content plan')
  }

  return c.json(await createExportPackage(c.get('workspaceId'), input), 201)
})

exportsRouter.get('/:id', async (c) => {
  const pkg = await findExportPackage(c.get('workspaceId'), c.req.param('id'))
  if (!pkg) return notFound(c, 'Export package')
  return c.json(pkg)
})

exportsRouter.get('/:id/download', async (c) => {
  const pkg = await markExportDownloaded(c.get('workspaceId'), c.req.param('id'))
  if (!pkg) return notFound(c, 'Export package')

  return c.json({
    ...pkg,
    download: {
      type: 'manual-package-manifest',
      files: ['media/', 'caption.txt', 'hashtags.txt', 'platform-notes.txt', 'safety-checklist.txt', 'metadata.json'],
    },
  })
})

exportsRouter.delete('/:id', async (c) => {
  const pkg = await archiveExportPackage(c.get('workspaceId'), c.req.param('id'))
  if (!pkg) return notFound(c, 'Export package')
  return c.json(pkg)
})
