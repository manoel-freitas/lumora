export type StorageUploadResponse = {
  key: string
  bucket: string
  url?: string
  visibility: string
  contentType: string
  sizeBytes: number
}

export function splitListInput(value: string): string[] {
  const seen = new Set<string>()
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => {
      if (!item || seen.has(item)) return false
      seen.add(item)
      return true
    })
}

export function joinListInput(value: unknown): string {
  if (!Array.isArray(value)) return ''
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .join(', ')
}

export function buildCharacterPhotoMetadata(upload: StorageUploadResponse, isPrimary: boolean) {
  return {
    r2Key: upload.key,
    bucket: upload.bucket,
    url: upload.url,
    contentType: upload.contentType,
    sizeBytes: upload.sizeBytes,
    isPrimary,
  }
}

export function buildPrimaryPhotoPath(characterId: string, photoId: string): string {
  return `/api/characters/${characterId}/photos/${photoId}/primary`
}
