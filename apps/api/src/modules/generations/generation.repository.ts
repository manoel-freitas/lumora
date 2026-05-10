import { and, desc, eq } from 'drizzle-orm'
import type { CreateGenerationInput } from '@lumora/shared'
import { db } from '../../infra/db'
import { characterPhotos, characters, generations, influencerProfiles, workspaces } from '../../db/schema'

export async function listGenerations(workspaceId: string) {
  return db.query.generations.findMany({
    where: eq(generations.workspaceId, workspaceId),
    orderBy: [desc(generations.createdAt)],
  })
}

export async function findGeneration(workspaceId: string, id: string) {
  return db.query.generations.findFirst({
    where: and(eq(generations.workspaceId, workspaceId), eq(generations.id, id)),
  })
}

export async function findGenerationByIdempotencyKey(workspaceId: string, idempotencyKey?: string) {
  if (!idempotencyKey) return null
  return db.query.generations.findFirst({
    where: and(eq(generations.workspaceId, workspaceId), eq(generations.idempotencyKey, idempotencyKey)),
  })
}

export async function getWorkspace(workspaceId: string) {
  return db.query.workspaces.findFirst({ where: eq(workspaces.id, workspaceId) })
}

export async function findCharacter(workspaceId: string, characterId: string) {
  return db.query.characters.findFirst({
    where: and(eq(characters.workspaceId, workspaceId), eq(characters.id, characterId)),
  })
}

export async function findPersona(workspaceId: string, personaId: string) {
  return db.query.influencerProfiles.findFirst({
    where: and(eq(influencerProfiles.workspaceId, workspaceId), eq(influencerProfiles.id, personaId)),
  })
}

export async function findPrimaryCharacterPhoto(workspaceId: string, characterId: string) {
  return db.query.characterPhotos.findFirst({
    where: and(
      eq(characterPhotos.workspaceId, workspaceId),
      eq(characterPhotos.characterId, characterId),
      eq(characterPhotos.isPrimary, true),
    ),
  })
}

export async function insertGeneration(workspaceId: string, data: CreateGenerationInput & {
  finalPrompt?: string
  referencePhotoUrl?: string
  generationSettings?: Record<string, unknown>
}) {
  const [generation] = await db.insert(generations).values({
    workspaceId,
    characterId: data.characterId,
    influencerProfileId: data.influencerProfileId,
    campaignId: data.campaignId,
    promptTemplateId: data.promptTemplateId,
    type: data.type,
    platform: data.platform ?? 'instagram',
    contentRating: data.contentRating ?? 'sfw',
    prompt: data.prompt,
    finalPrompt: data.finalPrompt,
    negativePrompt: data.negativePrompt,
    width: data.width,
    height: data.height,
    duration: data.duration,
    referencePhotoUrl: data.referencePhotoUrl,
    generationSettings: data.generationSettings,
    idempotencyKey: data.idempotencyKey,
    status: 'queued',
  }).returning()

  return generation
}

export async function updateGenerationStatus(workspaceId: string, id: string, status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'expired' | 'moderation_failed') {
  const [generation] = await db.update(generations)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(generations.workspaceId, workspaceId), eq(generations.id, id)))
    .returning()

  return generation || null
}
