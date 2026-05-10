import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreate = vi.fn()

vi.mock('together-ai', () => {
  // Must use function constructor, not arrow, since `new Together()` is called
  const MockTogether = function (this: { images: { create: typeof mockCreate } }) {
    this.images = { create: mockCreate }
  } as unknown as typeof import('together-ai').default

  return { default: MockTogether }
})

import { generateImageViaTogether } from './together-image.provider'

describe('generateImageViaTogether', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.TOGETHER_AI_API_KEY = 'test-key'
  })

  it('throws if TOGETHER_AI_API_KEY missing', async () => {
    delete process.env.TOGETHER_AI_API_KEY
    await expect(generateImageViaTogether({ prompt: 'test' }))
      .rejects.toThrow('TOGETHER_AI_API_KEY not configured')
  })

  it('returns GeneratedMedia from base64 response', async () => {
    const fakeBase64 = Buffer.from('fake-png-data').toString('base64')
    mockCreate.mockResolvedValue({
      id: 'req-123',
      model: 'black-forest-labs/FLUX.1-schnell-Free',
      data: [{ b64_json: fakeBase64, index: 0, type: 'b64_json' }],
    })

    const result = await generateImageViaTogether({ prompt: 'a portrait' })

    expect(result.provider).toBe('together_ai')
    expect(result.ext).toBe('png')
    expect(result.contentType).toBe('image/png')
    expect(result.buffer).toBeInstanceOf(Buffer)
    expect(result.buffer.toString()).toBe('fake-png-data')
    expect(result.metadata).toMatchObject({ requestId: 'req-123' })
  })

  it('returns GeneratedMedia from URL response', async () => {
    mockCreate.mockResolvedValue({
      id: 'req-456',
      model: 'black-forest-labs/FLUX.1-schnell-Free',
      data: [{ url: 'https://example.com/image.png', index: 0, type: 'url' }],
    })

    const originalFetch = globalThis.fetch
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new TextEncoder().encode('downloaded-png').buffer,
    }) as unknown as typeof fetch

    const result = await generateImageViaTogether({ prompt: 'a sunset' })

    expect(result.provider).toBe('together_ai')
    expect(result.buffer.toString()).toBe('downloaded-png')

    globalThis.fetch = originalFetch
  })

  it('passes width/height/model/negativePrompt to SDK', async () => {
    mockCreate.mockResolvedValue({
      id: 'req-789',
      model: 'custom-model',
      data: [{ b64_json: Buffer.from('x').toString('base64'), index: 0, type: 'b64_json' }],
    })

    await generateImageViaTogether({
      prompt: 'test',
      negativePrompt: 'bad quality',
      width: 512,
      height: 768,
      model: 'custom-model',
    })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'custom-model',
        prompt: 'test',
        negative_prompt: 'bad quality',
        width: 512,
        height: 768,
        response_format: 'base64',
        n: 1,
      }),
    )
  })

  it('throws if no image data returned', async () => {
    mockCreate.mockResolvedValue({ id: 'req-empty', data: [] })

    await expect(generateImageViaTogether({ prompt: 'test' }))
      .rejects.toThrow('No image data returned')
  })

  it('uses default model when none specified', async () => {
    mockCreate.mockResolvedValue({
      id: 'r1',
      data: [{ b64_json: Buffer.from('x').toString('base64'), index: 0, type: 'b64_json' }],
    })

    await generateImageViaTogether({ prompt: 'test' })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'black-forest-labs/FLUX.1-schnell-Free',
      }),
    )
  })
})
