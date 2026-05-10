import type { GeneratedMedia } from '../types'
import { generateImageViaTogether } from '../providers/together-image.provider'
import { generateImageWithFaceId } from '../providers/fal.provider'

export async function generateImageWithoutCharacter(
  prompt: string,
  negativePrompt: string | undefined,
  width: number,
  height: number,
  settings: Record<string, unknown> = {},
): Promise<GeneratedMedia> {
  return generateImageViaTogether({
    prompt,
    negativePrompt,
    width,
    height,
    model: settings.model as string | undefined,
  })
}

export async function generateImageWithCharacter(
  prompt: string,
  negativePrompt: string | undefined,
  referencePhotoUrl: string,
  width: number,
  height: number,
  settings: Record<string, unknown> = {},
): Promise<GeneratedMedia> {
  try {
    return await generateImageWithFaceId({
      prompt,
      negativePrompt,
      referenceImageUrl: referencePhotoUrl,
      width,
      height,
      model: settings.model as string | undefined,
    })
  } catch (error) {
    // Fallback to Together text-to-image if fal.ai face-id fails
    if (process.env.FAL_FALLBACK_TOGETHER === 'true') {
      return generateImageViaTogether({
        prompt,
        negativePrompt,
        width,
        height,
      })
    }
    throw error
  }
}
