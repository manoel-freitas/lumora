import { and, eq } from 'drizzle-orm'
import type { UpsertInfluencerProfileInput } from '@lumora/shared'
import { db } from '../../infra/db'
import { characters } from '../../db/schema'
import { findAllCharacters } from '../characters/character.repository'

export const listPersonas = findAllCharacters

function findCharacterInWorkspace(workspaceId: string, id: string) {
  return db.query.characters.findFirst({
    where: and(eq(characters.workspaceId, workspaceId), eq(characters.id, id)),
  })
}

export const findPersonaById = findCharacterInWorkspace
export const findPersonaByCharacterId = findCharacterInWorkspace

export async function characterBelongsToWorkspace(workspaceId: string, characterId: string) {
  return Boolean(await findCharacterInWorkspace(workspaceId, characterId))
}

type PersonaFields = {
  displayName?: string
  niche?: string
  audience?: string
  backstory?: string
  personalityTraits?: string[]
  toneOfVoice?: string
  languages?: string[]
  contentPillars?: string[]
  visualStyle?: string
  boundaries?: string
  sfwPolicy?: string
  nsfwPolicy?: string
  disclosureNote?: string
}

function normalizePersonaFields(data: PersonaFields) {
  return {
    displayName: data.displayName,
    niche: data.niche,
    audience: data.audience,
    backstory: data.backstory,
    personalityTraits: data.personalityTraits ?? [],
    toneOfVoice: data.toneOfVoice,
    languages: data.languages ?? ['en'],
    contentPillars: data.contentPillars ?? [],
    visualStyle: data.visualStyle,
    boundaries: data.boundaries,
    sfwPolicy: data.sfwPolicy,
    nsfwPolicy: data.nsfwPolicy,
    disclosureNote: data.disclosureNote,
  }
}

export async function createPersona(workspaceId: string, data: PersonaFields & { characterId: string }) {
  const [character] = await db.update(characters)
    .set({ ...normalizePersonaFields(data), updatedAt: new Date() })
    .where(and(eq(characters.workspaceId, workspaceId), eq(characters.id, data.characterId)))
    .returning()
  return character
}

export async function updatePersona(workspaceId: string, id: string, data: Partial<UpsertInfluencerProfileInput>) {
  const [character] = await db.update(characters)
    .set({ ...normalizePersonaFields(data), updatedAt: new Date() })
    .where(and(eq(characters.workspaceId, workspaceId), eq(characters.id, id)))
    .returning()
  return character || null
}

export async function deletePersona(workspaceId: string, id: string) {
  const [deleted] = await db.delete(characters)
    .where(and(eq(characters.workspaceId, workspaceId), eq(characters.id, id)))
    .returning()
  return Boolean(deleted)
}

export async function upsertPersonaForCharacter(workspaceId: string, characterId: string, data: PersonaFields) {
  const existing = await findPersonaByCharacterId(workspaceId, characterId)
  if (!existing) return null
  return updatePersona(workspaceId, characterId, data)
}
