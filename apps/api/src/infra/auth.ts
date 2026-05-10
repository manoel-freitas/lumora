import { and, eq } from 'drizzle-orm'
import { createMiddleware } from 'hono/factory'
import { db } from './db'
import { users, workspaceMembers } from '../db/schema'
import { readSessionCookie, verifySession } from './session'

export type AuthUser = {
  id: string
  email: string
  workspaceId?: string
}

export type AppEnv = {
  Variables: {
    user: AuthUser
    workspaceId: string
  }
}

async function resolveUserId(c: Parameters<Parameters<typeof createMiddleware<AppEnv>>[0]>[0]): Promise<string | null> {
  const token = readSessionCookie(c)
  if (token) {
    const session = await verifySession(token)
    if (session?.sub) return session.sub
  }

  if (process.env.NODE_ENV === 'test') {
    const headerId = c.req.header('x-user-id') || c.req.header('x-test-user-id')
    if (headerId) return headerId
  }

  return null
}

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const userId = await resolveUserId(c)
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const workspaceId = c.req.header('x-workspace-id') || undefined
  c.set('user', { id: user.id, email: user.email, workspaceId })
  if (workspaceId) c.set('workspaceId', workspaceId)

  await next()
})

export const requireAdmin = createMiddleware<AppEnv>(async (c, next) => {
  const userId = await resolveUserId(c)
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  if (!user.isAdmin) return c.json({ error: 'Forbidden' }, 403)

  c.set('user', { id: user.id, email: user.email })
  await next()
})

export const requireWorkspace = createMiddleware<AppEnv>(async (c, next) => {
  const workspaceId = c.get('workspaceId') || c.req.header('x-workspace-id')
  const user = c.get('user')

  if (!workspaceId) {
    return c.json({ error: 'Workspace required' }, 400)
  }

  const membership = await db.query.workspaceMembers.findFirst({
    where: and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, user.id)),
  })

  if (!membership) {
    return c.json({ error: 'Workspace forbidden' }, 403)
  }

  c.set('workspaceId', workspaceId)
  await next()
})
