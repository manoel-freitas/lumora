import { randomUUID } from 'node:crypto'
import { Hono } from 'hono'
import type { AppEnv } from '../../infra/auth'
import { deleteFromR2, getSignedR2Url, uploadToR2 } from '../../infra/r2'
import {
  buildStorageKey,
  parseStorageKeyParam,
  validateImageUpload,
  validateSignedUrlRequest,
} from './storage.service'

export const storageRouter = new Hono<AppEnv>()

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Storage request failed'
}

storageRouter.post('/upload', async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body.file

    if (!(file instanceof File)) {
      return c.json({ error: 'File required' }, 400)
    }

    const { ext } = validateImageUpload({ contentType: file.type, sizeBytes: file.size })
    const workspaceId = c.get('workspaceId')
    const entity = body.entity === 'characters' || body.entity === 'generations' || body.entity === 'campaigns'
      ? body.entity
      : 'uploads'
    const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : randomUUID()
    const key = buildStorageKey({ workspaceId, entity, id, ext })
    const buffer = Buffer.from(await file.arrayBuffer())

    const upload = await uploadToR2({
      key,
      body: buffer,
      contentType: file.type,
      visibility: 'private',
    })

    return c.json({
      key: upload.key,
      bucket: upload.bucket,
      url: upload.url,
      visibility: 'private',
      contentType: file.type,
      sizeBytes: file.size,
    }, 201)
  } catch (error) {
    return c.json({ error: errorMessage(error) }, 400)
  }
})

storageRouter.get('/signed-url', async (c) => {
  try {
    const { key, bucket } = validateSignedUrlRequest({
      key: c.req.query('key'),
      bucket: c.req.query('bucket'),
    })
    const url = await getSignedR2Url(key, bucket)

    return c.json({ key, bucket, url, expiresInSeconds: 60 * 15 })
  } catch (error) {
    return c.json({ error: errorMessage(error) }, 400)
  }
})

storageRouter.delete('/:key{.+}', async (c) => {
  try {
    const key = parseStorageKeyParam(c.req.param('key'))
    const bucket = c.req.query('bucket') || process.env.R2_PRIVATE_BUCKET_NAME || process.env.R2_BUCKET_NAME

    if (!bucket) {
      return c.json({ error: 'Bucket required' }, 400)
    }

    await deleteFromR2(key, bucket)

    return c.json({ key, bucket, deleted: true })
  } catch (error) {
    return c.json({ error: errorMessage(error) }, 400)
  }
})
