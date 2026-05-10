import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  validateImageUpload,
  parseStorageKeyParam,
  validateSignedUrlRequest,
  buildStorageKey,
} from './storage.service'

describe('storage.service', () => {
  describe('validateImageUpload', () => {
    it('accepts JPEG under 10MB', () => {
      const result = validateImageUpload({ contentType: 'image/jpeg', sizeBytes: 1024 })
      expect(result.ext).toBe('jpg')
    })

    it('accepts PNG under 10MB', () => {
      const result = validateImageUpload({ contentType: 'image/png', sizeBytes: 5 * 1024 * 1024 })
      expect(result.ext).toBe('png')
    })

    it('accepts WEBP under 10MB', () => {
      const result = validateImageUpload({ contentType: 'image/webp', sizeBytes: 1024 })
      expect(result.ext).toBe('webp')
    })

    it('rejects unsupported type', () => {
      expect(() => validateImageUpload({ contentType: 'image/gif', sizeBytes: 1024 }))
        .toThrow('Unsupported image type')
    })

    it('rejects missing content type', () => {
      expect(() => validateImageUpload({ sizeBytes: 1024 }))
        .toThrow('Unsupported image type')
    })

    it('rejects zero size', () => {
      expect(() => validateImageUpload({ contentType: 'image/jpeg', sizeBytes: 0 }))
        .toThrow('Empty upload')
    })

    it('rejects over 10MB', () => {
      expect(() => validateImageUpload({ contentType: 'image/jpeg', sizeBytes: 11 * 1024 * 1024 }))
        .toThrow('Image exceeds 10MB limit')
    })

    it('handles case-insensitive content type', () => {
      const result = validateImageUpload({ contentType: 'Image/JPEG', sizeBytes: 1024 })
      expect(result.ext).toBe('jpg')
    })
  })

  describe('parseStorageKeyParam', () => {
    it('accepts valid workspaces key', () => {
      expect(parseStorageKeyParam('workspaces/ws-123/uploads/abc.jpg')).toBe('workspaces/ws-123/uploads/abc.jpg')
    })

    it('accepts valid characters key', () => {
      expect(parseStorageKeyParam('characters/char-1/photo.jpg')).toBe('characters/char-1/photo.jpg')
    })

    it('accepts valid generations key', () => {
      expect(parseStorageKeyParam('generations/gen-1.png')).toBe('generations/gen-1.png')
    })

    it('rejects empty key', () => {
      expect(() => parseStorageKeyParam('')).toThrow('Invalid storage key')
    })

    it('rejects undefined key', () => {
      expect(() => parseStorageKeyParam(undefined)).toThrow('Invalid storage key')
    })

    it('rejects path traversal', () => {
      expect(() => parseStorageKeyParam('workspaces/../../etc/passwd')).toThrow('Invalid storage key')
    })

    it('rejects backslash', () => {
      expect(() => parseStorageKeyParam('workspaces\\test')).toThrow('Invalid storage key')
    })

    it('rejects absolute path', () => {
      expect(() => parseStorageKeyParam('/etc/passwd')).toThrow('Invalid storage key')
    })

    it('rejects unknown prefix', () => {
      expect(() => parseStorageKeyParam('random/key.png')).toThrow('Invalid storage key')
    })
  })

  describe('validateSignedUrlRequest', () => {
    it('returns key and bucket for valid input', () => {
      const result = validateSignedUrlRequest({
        key: 'generations/abc.png',
        bucket: 'lumora-private',
      })
      expect(result).toEqual({ key: 'generations/abc.png', bucket: 'lumora-private' })
    })

    it('rejects missing bucket', () => {
      expect(() => validateSignedUrlRequest({ key: 'generations/abc.png', bucket: undefined }))
        .toThrow('Bucket required')
    })

    it('rejects empty bucket', () => {
      expect(() => validateSignedUrlRequest({ key: 'generations/abc.png', bucket: '  ' }))
        .toThrow('Bucket required')
    })
  })

  describe('buildStorageKey', () => {
    it('builds deterministic key', () => {
      const key = buildStorageKey({
        workspaceId: 'ws-123',
        entity: 'characters',
        id: 'char-456',
        ext: 'jpg',
      })
      expect(key).toBe('workspaces/ws-123/characters/char-456.jpg')
    })

    it('sanitizes entity stripping non-alpha', () => {
      const key = buildStorageKey({
        workspaceId: 'ws',
        entity: 'UPPER-case',
        id: 'abc-def_123',
        ext: 'jp!g',
      })
      // entity regex keeps only [a-z-], so UPPER-case becomes -case
      expect(key).toBe('workspaces/ws/-case/abc-def_123.jpg')
    })
  })
})
