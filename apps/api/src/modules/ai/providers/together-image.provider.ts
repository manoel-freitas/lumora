import Together from 'together-ai'
import type { GeneratedMedia } from '../types'

const DEFAULT_MODEL = 'black-forest-labs/FLUX.1-schnell-Free'

function getClient(): Together {
  if (!process.env.TOGETHER_AI_API_KEY) {
    throw new Error('TOGETHER_AI_API_KEY not configured')
  }
  return new Together()
}

export async function generateImageViaTogether(input: {
  prompt: string
  negativePrompt?: string
  width?: number
  height?: number
  model?: string
}): Promise<GeneratedMedia> {
  const client = getClient()
  const model = input.model || DEFAULT_MODEL
  const width = input.width || 1024
  const height = input.height || 1024

  const response = await client.images.create({
    model,
    prompt: input.prompt,
    negative_prompt: input.negativePrompt,
    width,
    height,
    response_format: 'base64',
    n: 1,
  })

  const imageData = response.data?.[0]
  if (!imageData) {
    throw new Error('No image data returned from Together AI')
  }

  if (imageData.type === 'url') {
    const imageResponse = await fetch(imageData.url)
    const buffer = Buffer.from(await imageResponse.arrayBuffer())
    return {
      buffer,
      contentType: 'image/png',
      ext: 'png',
      provider: 'together_ai',
      model,
      metadata: { requestId: response.id, togetherModel: response.model },
      estimatedCostUsd: '0.0000',
    }
  }

  // b64_json type
  const buffer = Buffer.from(imageData.b64_json, 'base64')
  return {
    buffer,
    contentType: 'image/png',
    ext: 'png',
    provider: 'together_ai',
    model,
    metadata: { requestId: response.id, togetherModel: response.model },
    estimatedCostUsd: '0.0000',
  }
}
