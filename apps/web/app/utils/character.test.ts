import { describe, expect, it } from 'vitest'
import {
  createEmptyCharacterForm,
  formatCharacterCreatedAt,
  getCharacterPhotoCount,
  getCharacterSummary,
  normalizeCharacterForm,
} from './character'

describe('character ui helpers', () => {
  it('normalizes empty optional fields before create/update requests', () => {
    expect(normalizeCharacterForm({
      name: '  Nova  ',
      description: '   ',
      triggerWord: ' lumora_nova ',
      isAdult: true,
    })).toEqual({
      name: 'Nova',
      description: undefined,
      triggerWord: 'lumora_nova',
      isAdult: true,
    })
  })

  it('creates default adult-coded character form state for v1', () => {
    expect(createEmptyCharacterForm()).toEqual({
      name: '',
      description: '',
      triggerWord: '',
      isAdult: true,
    })
  })

  it('derives safe display defaults for cards', () => {
    expect(getCharacterSummary({ id: '1', name: 'Nova' })).toBe('No description yet.')
    expect(getCharacterPhotoCount({ id: '1', name: 'Nova', photos: [{ id: 'photo-1' }] })).toBe(1)
    expect(formatCharacterCreatedAt('not-a-date')).toBe('Unknown date')
  })
})
