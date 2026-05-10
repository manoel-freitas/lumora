import { Hono } from 'hono'
import { addWorkspaceMemberSchema, createWorkspaceSchema, updateWorkspaceSchema } from '@lumora/shared'
import type { AppEnv } from '../../infra/auth'
import { notFound, parseJson } from '../../infra/http'
import {
  addWorkspaceMember,
  createWorkspace,
  findWorkspaceForUser,
  listUserWorkspaces,
  updateWorkspaceForUser,
  userCanAccessWorkspace,
} from './workspace.repository'

export const workspacesRouter = new Hono<AppEnv>()

workspacesRouter.get('/', async (c) => {
  const user = c.get('user')
  return c.json({ items: await listUserWorkspaces(user.id) })
})

workspacesRouter.post('/', async (c) => {
  const input = await parseJson(c, createWorkspaceSchema)
  if (input instanceof Response) return input

  const workspace = await createWorkspace(c.get('user').id, input)
  return c.json(workspace, 201)
})

workspacesRouter.get('/:id', async (c) => {
  const workspace = await findWorkspaceForUser(c.get('user').id, c.req.param('id'))
  if (!workspace) return notFound(c, 'Workspace')
  return c.json(workspace)
})

workspacesRouter.put('/:id', async (c) => {
  const input = await parseJson(c, updateWorkspaceSchema)
  if (input instanceof Response) return input

  const workspace = await updateWorkspaceForUser(c.get('user').id, c.req.param('id'), input)
  if (!workspace) return notFound(c, 'Workspace')
  return c.json(workspace)
})

workspacesRouter.post('/:id/members', async (c) => {
  const workspaceId = c.req.param('id')
  const canAccess = await userCanAccessWorkspace(c.get('user').id, workspaceId)
  if (!canAccess) return notFound(c, 'Workspace')

  const input = await parseJson(c, addWorkspaceMemberSchema)
  if (input instanceof Response) return input

  const member = await addWorkspaceMember(workspaceId, input)
  if (!member) return notFound(c, 'User')
  return c.json(member, 201)
})
