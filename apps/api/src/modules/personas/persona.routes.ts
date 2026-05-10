import { Hono } from 'hono'
import { upsertInfluencerProfileSchema } from '@lumora/shared'
import type { AppEnv } from '../../infra/auth'
import { notFound, parseJson } from '../../infra/http'
import {
  characterBelongsToWorkspace,
  createPersona,
  deletePersona,
  findPersonaByCharacterId,
  findPersonaById,
  listPersonas,
  updatePersona,
  upsertPersonaForCharacter,
} from './persona.repository'

export const personasRouter = new Hono<AppEnv>()

personasRouter.get('/', async (c) => {
  return c.json({ items: await listPersonas(c.get('workspaceId')) })
})

personasRouter.post('/', async (c) => {
  const input = await parseJson(c, upsertInfluencerProfileSchema)
  if (input instanceof Response) return input

  const exists = await characterBelongsToWorkspace(c.get('workspaceId'), input.characterId)
  if (!exists) return notFound(c, 'Character')

  const persona = await createPersona(c.get('workspaceId'), input)
  return c.json(persona, 201)
})

personasRouter.get('/characters/:id/persona', async (c) => {
  const characterId = c.req.param('id')
  const exists = await characterBelongsToWorkspace(c.get('workspaceId'), characterId)
  if (!exists) return notFound(c, 'Character')

  const persona = await findPersonaByCharacterId(c.get('workspaceId'), characterId)
  return c.json({ persona })
})

personasRouter.put('/characters/:id/persona', async (c) => {
  const characterId = c.req.param('id')
  const exists = await characterBelongsToWorkspace(c.get('workspaceId'), characterId)
  if (!exists) return notFound(c, 'Character')

  const input = await parseJson(c, upsertInfluencerProfileSchema.omit({ characterId: true }))
  if (input instanceof Response) return input

  const persona = await upsertPersonaForCharacter(c.get('workspaceId'), characterId, input)
  return c.json(persona)
})

personasRouter.get('/:id', async (c) => {
  const persona = await findPersonaById(c.get('workspaceId'), c.req.param('id'))
  if (!persona) return notFound(c, 'Persona')
  return c.json(persona)
})

personasRouter.put('/:id', async (c) => {
  const input = await parseJson(c, upsertInfluencerProfileSchema.partial())
  if (input instanceof Response) return input

  if (input.characterId) {
    const exists = await characterBelongsToWorkspace(c.get('workspaceId'), input.characterId)
    if (!exists) return notFound(c, 'Character')
  }

  const persona = await updatePersona(c.get('workspaceId'), c.req.param('id'), input)
  if (!persona) return notFound(c, 'Persona')
  return c.json(persona)
})

personasRouter.delete('/:id', async (c) => {
  const deleted = await deletePersona(c.get('workspaceId'), c.req.param('id'))
  if (!deleted) return notFound(c, 'Persona')
  return c.json({ deleted: true })
})
