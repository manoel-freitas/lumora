import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSubscribe = vi.fn()
vi.mock('@fal-ai/client', () => ({
  createFalClient: () => ({
    subscribe: mockSubscribe,
  }),
}))

import { generateImageWithFaceId, generateVideoViaFal, downloadFalMedia } from './fal.provider'

describe('fal.ai provider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.FAL_KEY = 'test-fal-key'
  })

  describe('generateImageWithFaceId', () => {
    it('returns image from face-id model', async () => {
      mockSubscribe.mockResolvedValue({
        images: [{ url: 'https://fal.host/result.png' }],
      })

      const result = await generateImageWithFaceId({
        prompt: 'portrait',
        referenceImageUrl: 'https://ref.example/photo.jpg',
      })

      expect(result.provider).toBe('fal_ai')
      expect(result.ext).toBe('png')
      expect(result.model).toBe('fal-ai/ip-adapter-face-id')
      expect(result.metadata).toMatchObject({ falImageUrl: 'https://fal.host/result.png' })
    })

    it('passes negative prompt and dimensions', async () => {
      mockSubscribe.mockResolvedValue({
        images: [{ url: 'https://fal.host/result.png' }],
      })

      await generateImageWithFaceId({
        prompt: 'test',
        negativePrompt: 'blurry',
        referenceImageUrl: 'https://ref.example/photo.jpg',
        width: 512,
        height: 768,
      })

      expect(mockSubscribe).toHaveBeenCalledWith(
        'fal-ai/ip-adapter-face-id',
        expect.objectContaining({
          input: expect.objectContaining({
            prompt: 'test',
            negative_prompt: 'blurry',
            reference_image_url: 'https://ref.example/photo.jpg',
            width: 512,
            height: 768,
          }),
        }),
      )
    })

    it('uses custom model when provided', async () => {
      mockSubscribe.mockResolvedValue({
        images: [{ url: 'https://fal.host/result.png' }],
      })

      const result = await generateImageWithFaceId({
        prompt: 'test',
        referenceImageUrl: 'https://ref.example/photo.jpg',
        model: 'custom-model',
      })

      expect(result.model).toBe('custom-model')
    })

    it('throws if no image URL returned', async () => {
      mockSubscribe.mockResolvedValue({ images: [] })

      await expect(generateImageWithFaceId({
        prompt: 'test',
        referenceImageUrl: 'https://ref.example/photo.jpg',
      })).rejects.toThrow('No image URL returned')
    })

    it('throws if FAL_KEY missing', async () => {
      delete process.env.FAL_KEY
      await expect(generateImageWithFaceId({
        prompt: 'test',
        referenceImageUrl: 'https://ref.example/photo.jpg',
      })).rejects.toThrow('FAL_KEY not configured')
    })
  })

  describe('generateVideoViaFal', () => {
    it('uses text-to-video model without reference image', async () => {
      mockSubscribe.mockResolvedValue({
        video: { url: 'https://fal.host/video.mp4' },
      })

      const result = await generateVideoViaFal({ prompt: 'dancing' })

      expect(result.provider).toBe('fal_ai')
      expect(result.ext).toBe('mp4')
      expect(result.model).toBe('fal-ai/kling-video/v1.6/standard/text-to-video')
      expect(result.metadata).toMatchObject({ falVideoUrl: 'https://fal.host/video.mp4' })
    })

    it('uses image-to-video model with reference image', async () => {
      mockSubscribe.mockResolvedValue({
        video: { url: 'https://fal.host/video.mp4' },
      })

      await generateVideoViaFal({
        prompt: 'dancing',
        referenceImageUrl: 'https://ref.example/photo.jpg',
      })

      expect(mockSubscribe).toHaveBeenCalledWith(
        'fal-ai/kling-video/v1.6/standard/image-to-video',
        expect.objectContaining({
          input: expect.objectContaining({
            image_url: 'https://ref.example/photo.jpg',
          }),
        }),
      )
    })

    it('passes duration and custom model', async () => {
      mockSubscribe.mockResolvedValue({
        video: { url: 'https://fal.host/video.mp4' },
      })

      const result = await generateVideoViaFal({
        prompt: 'test',
        duration: 10,
        model: 'custom-video-model',
      })

      expect(result.model).toBe('custom-video-model')
      expect(result.metadata).toMatchObject({ duration: 10 })
    })

    it('throws if no video URL returned', async () => {
      mockSubscribe.mockResolvedValue({})

      await expect(generateVideoViaFal({ prompt: 'test' }))
        .rejects.toThrow('No video URL returned')
    })
  })

  describe('downloadFalMedia', () => {
    it('downloads and returns buffer from URL', async () => {
      const originalFetch = globalThis.fetch
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new TextEncoder().encode('media-bytes').buffer,
      }) as unknown as typeof fetch

      const buf = await downloadFalMedia('https://fal.host/result.png')
      expect(buf.toString()).toBe('media-bytes')

      globalThis.fetch = originalFetch
    })

    it('throws on non-ok response', async () => {
      const originalFetch = globalThis.fetch
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
      }) as unknown as typeof fetch

      await expect(downloadFalMedia('https://fal.host/result.png'))
        .rejects.toThrow('Failed to download fal media: 403')

      globalThis.fetch = originalFetch
    })
  })
})
