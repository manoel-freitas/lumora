import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../../infra/auth'
import { notFound } from '../../infra/http'
import { deleteFromR2, getSignedR2Url } from '../../infra/r2'
import { deleteGalleryItem, findGalleryItem, listGallery } from './gallery.repository'

const galleryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  characterId: z.string().uuid().optional(),
  influencerProfileId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
  type: z.enum(['image', 'video']).optional(),
  platform: z.enum(['instagram', 'tiktok', 'x', 'youtube_shorts', 'onlyfans', 'privacy', 'other']).optional(),
  contentRating: z.enum(['sfw', 'suggestive', 'adult']).optional(),
  moderationRating: z.enum(['safe', 'borderline', 'rejected']).optional(),
  approvalStatus: z.enum(['generated', 'reviewed', 'approved', 'rejected', 'scheduled', 'published']).optional(),
})

export const galleryRouter = new Hono<AppEnv>()

async function withSignedUrl(item: Awaited<ReturnType<typeof findGalleryItem>>) {
  if (!item?.generation?.r2Key || !item.generation.bucket || item.generation.url) return item
  return {
    ...item,
    signedUrl: await getSignedR2Url(item.generation.r2Key, item.generation.bucket),
  }
}

galleryRouter.get('/', async (c) => {
  const parsed = galleryQuerySchema.safeParse(c.req.query())
  if (!parsed.success) return c.json({ error: 'Validation failed', issues: parsed.error.flatten() }, 400)

  const result = await listGallery(c.get('workspaceId'), parsed.data)
  return c.json(result)
})

galleryRouter.get('/:id', async (c) => {
  const item = await findGalleryItem(c.get('workspaceId'), c.req.param('id'))
  if (!item) return notFound(c, 'Gallery item')
  return c.json(await withSignedUrl(item))
})

galleryRouter.delete('/:id', async (c) => {
  const item = await findGalleryItem(c.get('workspaceId'), c.req.param('id'))
  if (!item) return notFound(c, 'Gallery item')

  if (item.generation.r2Key && item.generation.bucket) {
    await deleteFromR2(item.generation.r2Key, item.generation.bucket)
  }

  await deleteGalleryItem(c.get('workspaceId'), c.req.param('id'))
  return c.json({ deleted: true })
})
