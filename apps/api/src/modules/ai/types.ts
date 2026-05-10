export type GeneratedMedia = {
  buffer: Buffer
  contentType: string
  ext: string
  provider: 'together_ai' | 'fal_ai'
  model: string
  modelVersion?: string
  metadata?: unknown
  estimatedCostUsd?: string
}
