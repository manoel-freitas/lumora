export type CharacterListItem = {
  id: string
  name: string
  description?: string | null
  triggerWord?: string | null
  isAdult?: boolean | null
  photos?: unknown[] | null
  createdAt?: string | Date | null
}

export type CharacterFormState = {
  name: string
  description: string
  triggerWord: string
  isAdult: boolean
}

export function createEmptyCharacterForm(): CharacterFormState {
  return {
    name: '',
    description: '',
    triggerWord: '',
    isAdult: true,
  }
}

export function normalizeCharacterForm(state: CharacterFormState) {
  return {
    name: state.name.trim(),
    description: state.description.trim() || undefined,
    triggerWord: state.triggerWord.trim() || undefined,
    isAdult: state.isAdult,
  }
}

export function getCharacterSummary(character: CharacterListItem): string {
  return character.description?.trim() || 'No description yet.'
}

export function getCharacterPhotoCount(character: CharacterListItem): number {
  return Array.isArray(character.photos) ? character.photos.length : 0
}

export function formatCharacterCreatedAt(value?: string | Date | null): string {
  if (!value) return 'Not created yet'

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown date'

  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}
