const allowedImageTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])

const maxImageSizeBytes = 10 * 1024 * 1024
const allowedKeyPrefixes = ['workspaces/', 'characters/', 'generations/', 'campaigns/', 'exports/']

export function validateImageUpload(input: { contentType?: string; sizeBytes?: number }): { ext: string } {
  const contentType = input.contentType?.toLowerCase()
  const ext = contentType ? allowedImageTypes.get(contentType) : undefined

  if (!ext) {
    throw new Error('Unsupported image type')
  }

  if (!input.sizeBytes || input.sizeBytes <= 0) {
    throw new Error('Empty upload')
  }

  if (input.sizeBytes > maxImageSizeBytes) {
    throw new Error('Image exceeds 10MB limit')
  }

  return { ext }
}

export function parseStorageKeyParam(value: string | undefined): string {
  const key = decodeURIComponent(value || '').trim()

  if (!key || key.startsWith('/') || key.includes('..') || key.includes('\\')) {
    throw new Error('Invalid storage key')
  }

  if (!allowedKeyPrefixes.some((prefix) => key.startsWith(prefix))) {
    throw new Error('Invalid storage key')
  }

  return key
}

export function validateSignedUrlRequest(input: { key?: string; bucket?: string }): { key: string; bucket: string } {
  const key = parseStorageKeyParam(input.key)
  const bucket = input.bucket?.trim()

  if (!bucket) {
    throw new Error('Bucket required')
  }

  return { key, bucket }
}

export function buildStorageKey(input: {
  workspaceId: string
  entity: 'uploads' | 'characters' | 'generations' | 'campaigns'
  id: string
  ext: string
}): string {
  const entity = input.entity.replace(/[^a-z-]/g, '')
  const id = input.id.replace(/[^a-zA-Z0-9_-]/g, '')
  const ext = input.ext.replace(/[^a-z0-9]/g, '')

  if (!entity || !id || !ext) {
    throw new Error('Invalid storage key')
  }

  return `workspaces/${input.workspaceId}/${entity}/${id}.${ext}`
}
