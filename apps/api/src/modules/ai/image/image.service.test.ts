import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../providers/together-image.provider', () => ({
  generateImageViaTogether: vi.fn(),
}))

vi.mock('../providers/fal.provider', () => ({
  generateImageWithFaceId: vi.fn(),
}))

import { generateImageWithoutCharacter, generateImageWithCharacter } from './image.service'
import { generateImageViaTogether } from '../providers/together-image.provider'
import { generateImageWithFaceId } from '../providers/fal.provider'

const mockTogether = generateImageViaTogether as ReturnType<typeof vi.fn>
const mockFalFaceId = generateImageWithFaceId as ReturnType<typeof vi.fn>

const fakeMedia = {
  buffer: Buffer.from('fake'),
  contentType: 'image/png',
  ext: 'png',
  provider: 'together_ai' as const,
  model: 'test-model',
  estimatedCostUsd: '0.0000',
}

describe('image.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateImageWithoutCharacter', () => {
    it('delegates to Together AI provider', async () => {
      mockTogether.mockResolvedValue(fakeMedia)

      const result = await generateImageWithoutCharacter('portrait', undefined, 1024, 1024)

      expect(result).toBe(fakeMedia)
      expect(mockTogether).toHaveBeenCalledWith({
        prompt: 'portrait',
        negativePrompt: undefined,
        width: 1024,
        height: 1024,
        model: undefined,
      })
    })

    it('passes settings model override', async () => {
      mockTogether.mockResolvedValue(fakeMedia)

      await generateImageWithoutCharacter('portrait', 'blurry', 512, 512, { model: 'custom' })

      expect(mockTogether).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'custom', negativePrompt: 'blurry' }),
      )
    })
  })

  describe('generateImageWithCharacter', () => {
    it('delegates to fal.ai face-id provider', async () => {
      mockFalFaceId.mockResolvedValue({ ...fakeMedia, provider: 'fal_ai' })

      const result = await generateImageWithCharacter(
        'portrait', 'blurry', 'https://ref.example/photo.jpg', 1024, 1024,
      )

      expect(result.provider).toBe('fal_ai')
      expect(mockFalFaceId).toHaveBeenCalledWith({
        prompt: 'portrait',
        negativePrompt: 'blurry',
        referenceImageUrl: 'https://ref.example/photo.jpg',
        width: 1024,
        height: 1024,
        model: undefined,
      })
    })

    it('falls back to Together AI when FAL_FALLBACK_TOGETHER=true', async () => {
      process.env.FAL_FALLBACK_TOGETHER = 'true'
      mockFalFaceId.mockRejectedValue(new Error('fal.ai unavailable'))
      mockTogether.mockResolvedValue(fakeMedia)

      const result = await generateImageWithCharacter(
        'portrait', undefined, 'https://ref.example/photo.jpg', 1024, 1024,
      )

      expect(result).toBe(fakeMedia)
      expect(mockTogether).toHaveBeenCalled()

      delete process.env.FAL_FALLBACK_TOGETHER
    })

    it('propagates error when no fallback configured', async () => {
      delete process.env.FAL_FALLBACK_TOGETHER
      mockFalFaceId.mockRejectedValue(new Error('fal.ai unavailable'))

      await expect(
        generateImageWithCharacter('portrait', undefined, 'https://ref.example/photo.jpg', 1024, 1024),
      ).rejects.toThrow('fal.ai unavailable')
    })
  })
})
