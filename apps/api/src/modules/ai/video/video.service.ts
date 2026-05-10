import type { GeneratedMedia } from '../types'
import { generateVideoViaFal } from '../providers/fal.provider'

export async function generateVideo(
  prompt: string,
  referencePhotoUrl: string | undefined,
  duration: number,
  settings: Record<string, unknown> = {},
): Promise<GeneratedMedia> {
  return generateVideoViaFal({
    prompt,
    referenceImageUrl: referencePhotoUrl,
    duration,
    model: settings.model as string | undefined,
  })
}
