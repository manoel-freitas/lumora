import 'dotenv/config'
import { Worker } from 'bullmq'
import { eq } from 'drizzle-orm'
import { connection } from './src/infra/queue'
import { db } from './src/infra/db'
import { generations } from './src/db/schema'
import {
  generateImageWithoutCharacter,
  generateImageWithCharacter,
} from './src/modules/ai/image/image.service'
import { generateVideo } from './src/modules/ai/video/video.service'
import { downloadFalMedia } from './src/modules/ai/providers/fal.provider'
import { uploadToR2 } from './src/infra/r2'
import { runPostGenerationModeration } from './src/modules/moderation/moderation.service'
import { createContentAssetFromGeneration } from './src/modules/content-assets/content-asset.service'
import { recordGenerationCost } from './src/modules/usage/usage.service'

async function resolveMediaBuffer(media: { buffer: Buffer; metadata?: unknown; provider: string }): Promise<Buffer> {
  // fal.ai providers return the URL as the buffer content
  if (media.provider === 'fal_ai' && media.metadata) {
    const meta = media.metadata as Record<string, unknown>
    const falUrl = meta.falImageUrl || meta.falVideoUrl
    if (typeof falUrl === 'string' && falUrl.startsWith('http')) {
      return downloadFalMedia(falUrl)
    }
  }
  return media.buffer
}

const worker = new Worker('generations', async (job) => {
  const { generationId } = job.data as { generationId: string }

  const generation = await db.query.generations.findFirst({
    where: eq(generations.id, generationId),
  })

  if (!generation) {
    throw new Error(`Generation ${generationId} not found`)
  }

  await db.update(generations)
    .set({ status: 'processing', updatedAt: new Date() })
    .where(eq(generations.id, generationId))

  const settings = (generation.generationSettings || {}) as Record<string, unknown>

  try {
    const media = generation.type === 'image'
      ? generation.referencePhotoUrl
        ? await generateImageWithCharacter(
          generation.finalPrompt || generation.prompt,
          generation.negativePrompt || undefined,
          generation.referencePhotoUrl,
          generation.width || 1024,
          generation.height || 1024,
          settings,
        )
        : await generateImageWithoutCharacter(
          generation.finalPrompt || generation.prompt,
          generation.negativePrompt || undefined,
          generation.width || 1024,
          generation.height || 1024,
          settings,
        )
      : await generateVideo(
        generation.finalPrompt || generation.prompt,
        generation.referencePhotoUrl || undefined,
        generation.duration || 5,
        settings,
      )

    const buffer = await resolveMediaBuffer(media)
    const r2Key = `generations/${generationId}.${media.ext}`

    const upload = await uploadToR2({
      key: r2Key,
      body: buffer,
      contentType: media.contentType,
      visibility: 'private',
    })

    await db.update(generations).set({
      status: 'completed',
      r2Key: upload.key,
      bucket: upload.bucket,
      url: upload.url,
      provider: media.provider,
      model: media.model,
      modelVersion: media.modelVersion,
      metadata: media.metadata as Record<string, unknown>,
      updatedAt: new Date(),
    }).where(eq(generations.id, generationId))

    const moderation = await runPostGenerationModeration(generationId)

    if (moderation.rating === 'rejected') {
      await db.update(generations).set({
        status: 'moderation_failed',
        updatedAt: new Date(),
      }).where(eq(generations.id, generationId))
      return
    }

    await createContentAssetFromGeneration(generationId, moderation.rating)

    await recordGenerationCost({
      workspaceId: generation.workspaceId,
      generationId,
      provider: media.provider,
      model: media.model,
      estimatedCostUsd: media.estimatedCostUsd,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown generation error'
    await db.update(generations).set({
      status: 'failed',
      error: message,
      updatedAt: new Date(),
    }).where(eq(generations.id, generationId))
    throw error
  }
}, {
  connection,
  concurrency: Number(process.env.GENERATION_WORKER_CONCURRENCY || 3),
})

worker.on('failed', async (job, err) => {
  if (!job) return

  // Status already updated in try/catch above, but guard for edge cases
  try {
    const existing = await db.query.generations.findFirst({
      where: eq(generations.id, job.data.generationId),
      columns: { status: true },
    })
    if (existing && existing.status !== 'failed') {
      await db.update(generations).set({
        status: 'failed',
        error: err.message,
        updatedAt: new Date(),
      }).where(eq(generations.id, job.data.generationId))
    }
  } catch {
    // DB may be unavailable; nothing more to do
  }
})
