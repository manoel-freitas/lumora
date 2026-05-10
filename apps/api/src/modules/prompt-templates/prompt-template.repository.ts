import { and, eq, isNull, or } from 'drizzle-orm'
import type { CreatePromptTemplateInput, UpdatePromptTemplateInput } from '@lumora/shared'
import { db } from '../../infra/db'
import { promptTemplates } from '../../db/schema'
import { defaultPromptTemplates } from './default-templates'

export async function seedSystemPromptTemplates() {
  const created = []

  for (const template of defaultPromptTemplates) {
    const existing = await db.query.promptTemplates.findFirst({
      where: and(
        isNull(promptTemplates.workspaceId),
        eq(promptTemplates.name, template.name),
        eq(promptTemplates.platform, template.platform),
        eq(promptTemplates.mediaType, template.mediaType),
      ),
    })

    if (existing) continue

    const [row] = await db.insert(promptTemplates).values({
      ...template,
      workspaceId: null,
      isSystem: true,
    }).returning()
    created.push(row)
  }

  return created
}

export async function listPromptTemplates(workspaceId: string) {
  await seedSystemPromptTemplates()
  return db.query.promptTemplates.findMany({
    where: or(isNull(promptTemplates.workspaceId), eq(promptTemplates.workspaceId, workspaceId)),
  })
}

export async function findPromptTemplate(workspaceId: string, id: string) {
  return db.query.promptTemplates.findFirst({
    where: and(
      eq(promptTemplates.id, id),
      or(isNull(promptTemplates.workspaceId), eq(promptTemplates.workspaceId, workspaceId)),
    ),
  })
}

type PromptTemplateWrite = CreatePromptTemplateInput | {
  name: string
  platform: CreatePromptTemplateInput['platform']
  contentRating?: CreatePromptTemplateInput['contentRating']
  mediaType: CreatePromptTemplateInput['mediaType']
  template: string
  negativePrompt?: string
  variables?: string[]
}

function normalizePromptTemplate(data: PromptTemplateWrite) {
  return {
    ...data,
    contentRating: data.contentRating ?? 'sfw',
    variables: data.variables ?? [],
  }
}

export async function createPromptTemplate(workspaceId: string, data: PromptTemplateWrite) {
  const [template] = await db.insert(promptTemplates).values({ workspaceId, ...normalizePromptTemplate(data), isSystem: false }).returning()
  return template
}

export async function updatePromptTemplate(workspaceId: string, id: string, data: UpdatePromptTemplateInput) {
  const existing = await findPromptTemplate(workspaceId, id)
  if (!existing || existing.isSystem || existing.workspaceId !== workspaceId) return null

  const [template] = await db.update(promptTemplates)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(promptTemplates.id, id), eq(promptTemplates.workspaceId, workspaceId)))
    .returning()

  return template || null
}

export async function deletePromptTemplate(workspaceId: string, id: string) {
  const existing = await findPromptTemplate(workspaceId, id)
  if (!existing || existing.isSystem || existing.workspaceId !== workspaceId) return false

  const [template] = await db.delete(promptTemplates)
    .where(and(eq(promptTemplates.id, id), eq(promptTemplates.workspaceId, workspaceId)))
    .returning()

  return Boolean(template)
}
