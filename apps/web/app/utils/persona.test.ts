import { describe, expect, it } from 'vitest'
import { buildCharacterPhotoMetadata, buildPrimaryPhotoPath, joinListInput, splitListInput } from './persona'

describe('persona and character UI helpers', () => {
  it('splits comma-separated persona fields into trimmed unique entries', () => {
    expect(splitListInput('fashion, travel, fashion,  wellness ,,')).toEqual(['fashion', 'travel', 'wellness'])
  })

  it('joins existing persona arrays for textarea input', () => {
    expect(joinListInput(['en', 'pt-BR', '', 'es'])).toBe('en, pt-BR, es')
  })

  it('builds character photo metadata from storage upload response', () => {
    expect(buildCharacterPhotoMetadata({
      key: 'workspaces/ws/characters/char-1/photo.webp',
      bucket: 'private-bucket',
      url: undefined,
      contentType: 'image/webp',
      sizeBytes: 1234,
      visibility: 'private',
    }, true)).toEqual({
      r2Key: 'workspaces/ws/characters/char-1/photo.webp',
      bucket: 'private-bucket',
      url: undefined,
      contentType: 'image/webp',
      sizeBytes: 1234,
      isPrimary: true,
    })
  })

  it('uses primary photo endpoint path required by API', () => {
    expect(buildPrimaryPhotoPath('char-1', 'photo-1')).toBe('/api/characters/char-1/photos/photo-1/primary')
  })
})
