import { createFalClient } from '@fal-ai/client'
import type { GeneratedMedia } from '../types'

const IMAGE_MODEL = 'fal-ai/ip-adapter-face-id'
const IMAGE_FALLBACK_MODEL = 'fal-ai/flux/dev/image-to-image'
const VIDEO_TEXT_MODEL = 'fal-ai/kling-video/v1.6/standard/text-to-video'
const VIDEO_IMAGE_MODEL = 'fal-ai/kling-video/v1.6/standard/image-to-video'

function getClient() {
  if (!process.env.FAL_KEY) {
    throw new Error('FAL_KEY not configured')
  }
  return createFalClient({ credentials: process.env.FAL_KEY })
}

export async function generateImageWithFaceId(input: {
  prompt: string
  negativePrompt?: string
  referenceImageUrl: string
  width?: number
  height?: number
  model?: string
  fallback?: boolean
}): Promise<GeneratedMedia> {
  const fal = getClient()
  const model = input.model || IMAGE_MODEL
  const width = input.width || 1024
  const height = input.height || 1024

  const result = await fal.subscribe(model, {
    input: {
      prompt: input.prompt,
      negative_prompt: input.negativePrompt,
      reference_image_url: input.referenceImageUrl,
      width,
      height,
      num_images: 1,
    },
    pollInterval: 3000,
    logs: false,
  })

  return extractImageResult(result, model)
}

export async function generateVideoViaFal(input: {
  prompt: string
  referenceImageUrl?: string
  duration?: number
  model?: string
}): Promise<GeneratedMedia> {
  const fal = getClient()
  const duration = input.duration || 5

  const model = input.model || (input.referenceImageUrl ? VIDEO_IMAGE_MODEL : VIDEO_TEXT_MODEL)

  const falInput: Record<string, unknown> = {
    prompt: input.prompt,
    duration: `${duration}`,
  }

  if (input.referenceImageUrl) {
    falInput.image_url = input.referenceImageUrl
  }

  const result = await fal.subscribe(model, {
    input: falInput,
    pollInterval: 5000,
    logs: false,
  })

  return extractVideoResult(result, model, duration)
}

function extractImageResult(result: Record<string, unknown>, model: string): GeneratedMedia {
  const images = result.images as Array<{ url: string }> | undefined
  const imageUrl = images?.[0]?.url

  if (!imageUrl) {
    throw new Error('No image URL returned from fal.ai')
  }

  // Store URL reference; actual download happens in worker before R2 upload
  return {
    buffer: Buffer.from(imageUrl),
    contentType: 'image/png',
    ext: 'png',
    provider: 'fal_ai',
    model,
    metadata: { falImageUrl: imageUrl, rawResult: result },
    estimatedCostUsd: '0.0000',
  }
}

function extractVideoResult(result: Record<string, unknown>, model: string, duration: number): GeneratedMedia {
  const video = result.video as { url: string } | undefined
  const videoUrl = video?.url

  if (!videoUrl) {
    throw new Error('No video URL returned from fal.ai')
  }

  return {
    buffer: Buffer.from(videoUrl),
    contentType: 'video/mp4',
    ext: 'mp4',
    provider: 'fal_ai',
    model,
    metadata: { falVideoUrl: videoUrl, duration, rawResult: result },
    estimatedCostUsd: '0.0000',
  }
}

export async function downloadFalMedia(falUrl: string): Promise<Buffer> {
  const response = await fetch(falUrl)
  if (!response.ok) {
    throw new Error(`Failed to download fal media: ${response.status}`)
  }
  return Buffer.from(await response.arrayBuffer())
}
