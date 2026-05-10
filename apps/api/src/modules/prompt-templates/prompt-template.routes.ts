import { Hono } from 'hono'
import { createPromptTemplateSchema, renderPromptTemplateSchema, updatePromptTemplateSchema } from '@lumora/shared'
import type { AppEnv } from '../../infra/auth'
import { notFound, parseJson } from '../../infra/http'
import {
  createPromptTemplate,
  deletePromptTemplate,
  findPromptTemplate,
  listPromptTemplates,
  updatePromptTemplate,
} from './prompt-template.repository'
import { renderPromptTemplate } from './prompt-template.service'

export const promptTemplatesRouter = new Hono<AppEnv>()

promptTemplatesRouter.get('/', async (c) => {
  const items = await listPromptTemplates(c.get('workspaceId'))
  return c.json({ items })
})

promptTemplatesRouter.post('/', async (c) => {
  const input = await parseJson(c, createPromptTemplateSchema)
  if (input instanceof Response) return input

  const template = await createPromptTemplate(c.get('workspaceId'), input)
  return c.json(template, 201)
})

promptTemplatesRouter.get('/:id', async (c) => {
  const template = await findPromptTemplate(c.get('workspaceId'), c.req.param('id'))
  if (!template) return notFound(c, 'Prompt template')
  return c.json(template)
})

promptTemplatesRouter.put('/:id', async (c) => {
  const input = await parseJson(c, updatePromptTemplateSchema)
  if (input instanceof Response) return input

  const template = await updatePromptTemplate(c.get('workspaceId'), c.req.param('id'), input)
  if (!template) return notFound(c, 'Prompt template')
  return c.json(template)
})

promptTemplatesRouter.delete('/:id', async (c) => {
  const deleted = await deletePromptTemplate(c.get('workspaceId'), c.req.param('id'))
  if (!deleted) return notFound(c, 'Prompt template')
  return c.json({ deleted: true })
})

promptTemplatesRouter.post('/:id/render', async (c) => {
  const template = await findPromptTemplate(c.get('workspaceId'), c.req.param('id'))
  if (!template) return notFound(c, 'Prompt template')

  const input = await parseJson(c, renderPromptTemplateSchema)
  if (input instanceof Response) return input

  return c.json({
    promptTemplateId: template.id,
    rendered: renderPromptTemplate(template.template, input.variables ?? {}),
    negativePrompt: template.negativePrompt,
    variables: input.variables,
  })
})
