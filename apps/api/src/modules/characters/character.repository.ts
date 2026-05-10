import { and, eq } from 'drizzle-orm'
import { db } from '../../infra/db'
import { characterPhotos, characters } from '../../db/schema'
import type { CreateCharacterInput, UpdateCharacterInput } from '@lumora/shared'

export async function findAllCharacters(workspaceId: string) {
  return db.query.characters.findMany({ where: eq(characters.workspaceId, workspaceId) })
}

export async function findCharacterById(workspaceId: string, id: string) {
  const character = await db.query.characters.findFirst({
    where: and(eq(characters.workspaceId, workspaceId), eq(characters.id, id)),
  })
  if (!character) return null

  const photos = await db.query.characterPhotos.findMany({
    where: and(eq(characterPhotos.workspaceId, workspaceId), eq(characterPhotos.characterId, id)),
  })

  return { ...character, photos }
}

export async function createCharacter(workspaceId: string, data: CreateCharacterInput | { name: string; description?: string; triggerWord?: string; isAdult?: boolean }) {
  const [character] = await db.insert(characters).values({ workspaceId, ...data, isAdult: data.isAdult ?? true }).returning()
  return character
}

export async function updateCharacter(workspaceId: string, id: string, data: UpdateCharacterInput) {
  const [character] = await db.update(characters)
    .set({
      name: data.name,
      description: data.description,
      triggerWord: data.triggerWord,
      isAdult: data.isAdult,
      displayName: data.displayName,
      niche: data.niche,
      audience: data.audience,
      backstory: data.backstory,
      personalityTraits: data.personalityTraits,
      toneOfVoice: data.toneOfVoice,
      languages: data.languages,
      contentPillars: data.contentPillars,
      visualStyle: data.visualStyle,
      boundaries: data.boundaries,
      sfwPolicy: data.sfwPolicy,
      nsfwPolicy: data.nsfwPolicy,
      disclosureNote: data.disclosureNote,
      updatedAt: new Date(),
    })
    .where(and(eq(characters.workspaceId, workspaceId), eq(characters.id, id)))
    .returning()
  return character || null
}

export async function deleteCharacter(workspaceId: string, id: string) {
  const [deleted] = await db.delete(characters)
    .where(and(eq(characters.workspaceId, workspaceId), eq(characters.id, id)))
    .returning()
  return Boolean(deleted)
}

export async function addCharacterPhoto(workspaceId: string, characterId: string, data: {
  r2Key: string
  bucket?: string
  url?: string
  contentType?: string
  sizeBytes?: number
  checksum?: string
  isPrimary?: boolean
}) {
  if (data.isPrimary) {
    await db.update(characterPhotos)
      .set({ isPrimary: false })
      .where(and(eq(characterPhotos.workspaceId, workspaceId), eq(characterPhotos.characterId, characterId)))
  }

  const [photo] = await db.insert(characterPhotos).values({
    workspaceId,
    characterId,
    r2Key: data.r2Key,
    bucket: data.bucket,
    url: data.url,
    contentType: data.contentType,
    sizeBytes: data.sizeBytes,
    checksum: data.checksum,
    isPrimary: data.isPrimary ?? false,
  }).returning()

  return photo
}

export async function deleteCharacterPhoto(workspaceId: string, characterId: string, photoId: string) {
  const [deleted] = await db.delete(characterPhotos)
    .where(and(
      eq(characterPhotos.workspaceId, workspaceId),
      eq(characterPhotos.characterId, characterId),
      eq(characterPhotos.id, photoId),
    ))
    .returning()
  return Boolean(deleted)
}

export async function setPrimaryCharacterPhoto(workspaceId: string, characterId: string, photoId: string) {
  const photo = await db.query.characterPhotos.findFirst({
    where: and(
      eq(characterPhotos.workspaceId, workspaceId),
      eq(characterPhotos.characterId, characterId),
      eq(characterPhotos.id, photoId),
    ),
  })
  if (!photo) return null

  await db.update(characterPhotos)
    .set({ isPrimary: false })
    .where(and(eq(characterPhotos.workspaceId, workspaceId), eq(characterPhotos.characterId, characterId)))

  const [updated] = await db.update(characterPhotos)
    .set({ isPrimary: true })
    .where(eq(characterPhotos.id, photoId))
    .returning()

  return updated
}
