import { z } from 'zod'
import { workspaceRoleSchema } from './common'

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(255),
})

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  adultModeEnabled: z.boolean().optional(),
})

export const addWorkspaceMemberSchema = z.object({
  userId: z.string().uuid(),
  role: workspaceRoleSchema.default('member'),
})

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>
export type AddWorkspaceMemberInput = z.infer<typeof addWorkspaceMemberSchema>
