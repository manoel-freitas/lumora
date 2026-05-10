import type { CreateGenerationInput } from '@lumora/shared'
import { generationQueue } from '../../infra/queue'
import { assertUsageQuotaAllows } from '../usage/usage.repository'
import { persistPromptPrecheck } from '../moderation/moderation.service'
import { findPromptTemplate } from '../prompt-templates/prompt-template.repository'
import { renderPromptTemplate } from '../prompt-templates/prompt-template.service'
import {
  findCharacter,
  findGenerationByIdempotencyKey,
  findPersona,
  findPrimaryCharacterPhoto,
  getWorkspace,
  insertGeneration,
} from './generation.repository'

export async function createGeneration(workspaceId: string, data: CreateGenerationInput) {
  const existing = await findGenerationByIdempotencyKey(workspaceId, data.idempotencyKey)
  if (existing) return existing

  await assertUsageQuotaAllows(workspaceId, data.type)

  const workspace = await getWorkspace(workspaceId)
  if (!workspace) throw new Error('Workspace not found')

  const platform = data.platform ?? 'instagram'
  const contentRating = data.contentRating ?? 'sfw'

  if (contentRating === 'adult') {
    if (process.env.ENABLE_ADULT_MODE !== 'true') throw new Error('Adult mode feature flag disabled')
    if (!workspace.adultModeEnabled) throw new Error('Workspace adult mode disabled')
    if (['instagram', 'tiktok'].includes(platform)) throw new Error('Adult content not allowed for platform')
  }

  if (data.characterId) {
    const character = await findCharacter(workspaceId, data.characterId)
    if (!character) throw new Error('Character not found')
  }

  if (data.influencerProfileId) {
    const persona = await findPersona(workspaceId, data.influencerProfileId)
    if (!persona) throw new Error('Persona not found')
  }

  let finalPrompt = data.prompt
  let negativePrompt = data.negativePrompt

  if (data.promptTemplateId) {
    const template = await findPromptTemplate(workspaceId, data.promptTemplateId)
    if (!template) throw new Error('Prompt template not found')

    finalPrompt = renderPromptTemplate(template.template, data.templateVariables ?? {})
    negativePrompt = negativePrompt || template.negativePrompt || undefined
  }

  const precheck = await persistPromptPrecheck({
    workspaceId,
    prompt: finalPrompt,
    platform,
    contentRating,
  })

  if (precheck.rating === 'rejected') {
    throw new Error(`Prompt rejected: ${precheck.detectedIssues.join(', ')}`)
  }

  const primaryPhoto = data.characterId
    ? await findPrimaryCharacterPhoto(workspaceId, data.characterId)
    : null

  const generation = await insertGeneration(workspaceId, {
    ...data,
    platform,
    contentRating,
    finalPrompt,
    negativePrompt,
    referencePhotoUrl: primaryPhoto?.url || undefined,
    generationSettings: {
      width: data.width ?? 1024,
      height: data.height ?? 1024,
      duration: data.duration ?? 5,
      templateVariables: data.templateVariables ?? {},
    },
  })

  await generationQueue.add('generate', { generationId: generation.id }, {
    jobId: data.idempotencyKey || generation.id,
  })

  return generation
}
