import { Hono } from 'hono'
import { z } from 'zod'
import { createCharacterSchema, updateCharacterSchema } from '@lumora/shared'
import type { AppEnv } from '../../infra/auth'
import { notFound, parseJson } from '../../infra/http'
import {
  addCharacterPhoto,
  createCharacter,
  deleteCharacter,
  deleteCharacterPhoto,
  findAllCharacters,
  findCharacterById,
  setPrimaryCharacterPhoto,
  updateCharacter,
} from './character.repository'

const addPhotoSchema = z.object({
  r2Key: z.string().min(1).max(500),
  bucket: z.string().max(255).optional(),
  url: z.string().max(1000).optional(),
  contentType: z.string().max(100).optional(),
  sizeBytes: z.number().int().optional(),
  checksum: z.string().max(255).optional(),
  isPrimary: z.boolean().optional(),
})

export const charactersRouter = new Hono<AppEnv>()

charactersRouter.get('/', async (c) => {
  const workspaceId = c.get('workspaceId')
  return c.json({ items: await findAllCharacters(workspaceId) })
})

charactersRouter.post('/', async (c) => {
  const input = await parseJson(c, createCharacterSchema)
  if (input instanceof Response) return input

  const character = await createCharacter(c.get('workspaceId'), input)
  return c.json(character, 201)
})

charactersRouter.get('/:id', async (c) => {
  const character = await findCharacterById(c.get('workspaceId'), c.req.param('id'))
  if (!character) return notFound(c, 'Character')
  return c.json(character)
})

charactersRouter.put('/:id', async (c) => {
  const input = await parseJson(c, updateCharacterSchema)
  if (input instanceof Response) return input

  const character = await updateCharacter(c.get('workspaceId'), c.req.param('id'), input)
  if (!character) return notFound(c, 'Character')
  return c.json(character)
})

charactersRouter.delete('/:id', async (c) => {
  const deleted = await deleteCharacter(c.get('workspaceId'), c.req.param('id'))
  if (!deleted) return notFound(c, 'Character')
  return c.json({ deleted: true })
})

charactersRouter.post('/:id/photos', async (c) => {
  const character = await findCharacterById(c.get('workspaceId'), c.req.param('id'))
  if (!character) return notFound(c, 'Character')

  const input = await parseJson(c, addPhotoSchema)
  if (input instanceof Response) return input

  const photo = await addCharacterPhoto(c.get('workspaceId'), c.req.param('id'), input)
  return c.json(photo, 201)
})

charactersRouter.delete('/:id/photos/:photoId', async (c) => {
  const deleted = await deleteCharacterPhoto(c.get('workspaceId'), c.req.param('id'), c.req.param('photoId'))
  if (!deleted) return notFound(c, 'Photo')
  return c.json({ deleted: true })
})

charactersRouter.put('/:id/photos/:photoId/primary', async (c) => {
  const photo = await setPrimaryCharacterPhoto(c.get('workspaceId'), c.req.param('id'), c.req.param('photoId'))
  if (!photo) return notFound(c, 'Photo')
  return c.json(photo)
})
