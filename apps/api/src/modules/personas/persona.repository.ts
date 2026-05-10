import { and, eq } from 'drizzle-orm'
import type { UpsertInfluencerProfileInput } from '@lumora/shared'
import { db } from '../../infra/db'
import { characters, influencerProfiles } from '../../db/schema'

export async function listPersonas(workspaceId: string) {
  return db.query.influencerProfiles.findMany({ where: eq(influencerProfiles.workspaceId, workspaceId) })
}

export async function findPersonaById(workspaceId: string, id: string) {
  return db.query.influencerProfiles.findFirst({
    where: and(eq(influencerProfiles.workspaceId, workspaceId), eq(influencerProfiles.id, id)),
  })
}

export async function findPersonaByCharacterId(workspaceId: string, characterId: string) {
  return db.query.influencerProfiles.findFirst({
    where: and(eq(influencerProfiles.workspaceId, workspaceId), eq(influencerProfiles.characterId, characterId)),
  })
}

export async function characterBelongsToWorkspace(workspaceId: string, characterId: string) {
  const character = await db.query.characters.findFirst({
    where: and(eq(characters.workspaceId, workspaceId), eq(characters.id, characterId)),
  })
  return Boolean(character)
}

type PersonaWrite = UpsertInfluencerProfileInput | {
  characterId: string
  displayName: string
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

function normalizePersona(data: PersonaWrite) {
  return {
    ...data,
    personalityTraits: data.personalityTraits ?? [],
    languages: data.languages ?? ['en'],
    contentPillars: data.contentPillars ?? [],
  }
}

export async function createPersona(workspaceId: string, data: PersonaWrite) {
  const [persona] = await db.insert(influencerProfiles).values({ workspaceId, ...normalizePersona(data) }).returning()
  return persona
}

export async function updatePersona(workspaceId: string, id: string, data: Partial<UpsertInfluencerProfileInput>) {
  const [persona] = await db.update(influencerProfiles)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(influencerProfiles.workspaceId, workspaceId), eq(influencerProfiles.id, id)))
    .returning()

  return persona || null
}

export async function deletePersona(workspaceId: string, id: string) {
  const [persona] = await db.delete(influencerProfiles)
    .where(and(eq(influencerProfiles.workspaceId, workspaceId), eq(influencerProfiles.id, id)))
    .returning()

  return Boolean(persona)
}

export async function upsertPersonaForCharacter(workspaceId: string, characterId: string, data: Omit<PersonaWrite, 'characterId'>) {
  const existing = await findPersonaByCharacterId(workspaceId, characterId)

  if (existing) {
    return updatePersona(workspaceId, existing.id, { ...data, characterId })
  }

  return createPersona(workspaceId, { ...data, characterId })
}
