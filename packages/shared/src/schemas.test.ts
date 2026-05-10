import { describe, it, expect } from 'vitest'
import {
  generationTypeSchema,
  contentRatingSchema,
  platformSchema,
  moderationRatingSchema,
  workspaceRoleSchema,
  createCharacterSchema,
  updateCharacterSchema,
  createGenerationSchema,
} from './index'

describe('common schemas', () => {
  describe('generationTypeSchema', () => {
    it('accepts image', () => expect(generationTypeSchema.parse('image')).toBe('image'))
    it('accepts video', () => expect(generationTypeSchema.parse('video')).toBe('video'))
    it('rejects invalid', () => expect(() => generationTypeSchema.parse('audio')).toThrow())
  })

  describe('contentRatingSchema', () => {
    it('accepts sfw', () => expect(contentRatingSchema.parse('sfw')).toBe('sfw'))
    it('accepts suggestive', () => expect(contentRatingSchema.parse('suggestive')).toBe('suggestive'))
    it('accepts adult', () => expect(contentRatingSchema.parse('adult')).toBe('adult'))
    it('rejects invalid', () => expect(() => contentRatingSchema.parse('explicit')).toThrow())
  })

  describe('platformSchema', () => {
    it('accepts instagram', () => expect(platformSchema.parse('instagram')).toBe('instagram'))
    it('accepts tiktok', () => expect(platformSchema.parse('tiktok')).toBe('tiktok'))
    it('accepts other', () => expect(platformSchema.parse('other')).toBe('other'))
    it('rejects invalid', () => expect(() => platformSchema.parse('facebook')).toThrow())
  })

  describe('moderationRatingSchema', () => {
    it('accepts safe', () => expect(moderationRatingSchema.parse('safe')).toBe('safe'))
    it('accepts rejected', () => expect(moderationRatingSchema.parse('rejected')).toBe('rejected'))
  })

  describe('workspaceRoleSchema', () => {
    it('accepts owner', () => expect(workspaceRoleSchema.parse('owner')).toBe('owner'))
    it('accepts viewer', () => expect(workspaceRoleSchema.parse('viewer')).toBe('viewer'))
    it('rejects invalid', () => expect(() => workspaceRoleSchema.parse('superadmin')).toThrow())
  })
})

describe('character schemas', () => {
  describe('createCharacterSchema', () => {
    it('accepts valid input with all fields', () => {
      const result = createCharacterSchema.parse({
        name: 'Luna',
        description: 'A virtual influencer',
        triggerWord: 'luna',
        isAdult: true,
      })
      expect(result.name).toBe('Luna')
    })

    it('accepts minimal input — name only, isAdult defaults to true', () => {
      const result = createCharacterSchema.parse({ name: 'Luna' })
      expect(result.name).toBe('Luna')
      expect(result.isAdult).toBe(true)
    })

    it('rejects empty name', () => {
      expect(() => createCharacterSchema.parse({ name: '' })).toThrow()
    })

    it('rejects missing name', () => {
      expect(() => createCharacterSchema.parse({})).toThrow()
    })
  })

  describe('updateCharacterSchema', () => {
    it('accepts partial update', () => {
      const result = updateCharacterSchema.parse({ name: 'Updated' })
      expect(result.name).toBe('Updated')
    })

    it('accepts empty object', () => {
      const result = updateCharacterSchema.parse({})
      expect(result).toEqual({})
    })
  })
})

describe('generation schema', () => {
  describe('createGenerationSchema', () => {
    it('accepts valid minimal input', () => {
      const result = createGenerationSchema.parse({
        prompt: 'A fashion portrait',
        type: 'image',
      })
      expect(result.prompt).toBe('A fashion portrait')
      expect(result.platform).toBe('instagram') // default
      expect(result.contentRating).toBe('sfw') // default
      expect(result.width).toBe(1024) // default
      expect(result.height).toBe(1024) // default
      expect(result.duration).toBe(5) // default
    })

    it('rejects empty prompt', () => {
      expect(() => createGenerationSchema.parse({ prompt: '', type: 'image' })).toThrow()
    })

    it('rejects invalid type', () => {
      expect(() => createGenerationSchema.parse({ prompt: 'test', type: 'audio' })).toThrow()
    })

    it('rejects invalid uuid for characterId', () => {
      expect(() => createGenerationSchema.parse({
        prompt: 'test',
        type: 'image',
        characterId: 'not-a-uuid',
      })).toThrow()
    })

    it('accepts valid uuid for characterId', () => {
      const result = createGenerationSchema.parse({
        prompt: 'test',
        type: 'image',
        characterId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.characterId).toBe('550e8400-e29b-41d4-a716-446655440000')
    })

    it('clamps duration to max 10', () => {
      expect(() => createGenerationSchema.parse({
        prompt: 'test',
        type: 'video',
        duration: 20,
      })).toThrow()
    })

    it('clamps duration to min 1', () => {
      expect(() => createGenerationSchema.parse({
        prompt: 'test',
        type: 'video',
        duration: 0,
      })).toThrow()
    })
  })
})
