import { Hono } from 'hono'
import type { Context } from 'hono'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { loginSchema, signupSchema } from '@lumora/shared'
import type { AppEnv } from '../../infra/auth'
import { parseJson } from '../../infra/http'
import { db } from '../../infra/db'
import { usageQuotas, users, workspaceMembers, workspaces } from '../../db/schema'
import {
  clearSessionCookie,
  readSessionCookie,
  setSessionCookie,
  signSession,
  verifySession,
} from '../../infra/session'
import { rateLimit } from '../../infra/rate-limit'

export const authRouter = new Hono<AppEnv>()

const loginLimiter = rateLimit({ name: 'auth:login', windowMs: 60_000, max: 10 })
const signupLimiter = rateLimit({ name: 'auth:signup', windowMs: 60_000, max: 5 })
const adminSetupLimiter = rateLimit({ name: 'auth:admin-setup', windowMs: 60_000, max: 5 })

// POST /auth/signup — create account with password
authRouter.post('/signup', signupLimiter, async (c) => {
  const input = await parseJson(c, signupSchema)
  if (input instanceof Response) return input

  const email = input.email.trim().toLowerCase()

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (existing && existing.passwordHash) {
    return c.json({ error: 'Email already registered. Please sign in.' }, 409)
  }

  const passwordHash = await bcrypt.hash(input.password, 12)

  let user: typeof users.$inferSelect
  if (existing) {
    const [updated] = await db.update(users)
      .set({ name: input.name ?? existing.name, passwordHash, updatedAt: new Date() })
      .where(eq(users.id, existing.id))
      .returning()
    user = updated
  } else {
    const [created] = await db.insert(users).values({ email, name: input.name, passwordHash }).returning()
    user = created
  }

  const workspaceId = await ensureDefaultWorkspace(user.id)
  const workspaces_list = await listUserWorkspaces(user.id)

  await issueSession(c, user)

  return c.json({
    user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin },
    defaultWorkspaceId: workspaceId,
    workspaces: workspaces_list,
  }, 201)
})

// POST /auth/login — sign in with password
authRouter.post('/login', loginLimiter, async (c) => {
  const input = await parseJson(c, loginSchema)
  if (input instanceof Response) return input

  const email = input.email.trim().toLowerCase()

  const user = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (!user || !user.passwordHash) {
    return c.json({ error: 'Invalid email or password.' }, 401)
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash)
  if (!valid) {
    return c.json({ error: 'Invalid email or password.' }, 401)
  }

  const workspaceId = await ensureDefaultWorkspace(user.id)
  const workspaces_list = await listUserWorkspaces(user.id)

  await issueSession(c, user)

  return c.json({
    user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin },
    defaultWorkspaceId: workspaceId,
    workspaces: workspaces_list,
  })
})

authRouter.post('/logout', (c) => {
  clearSessionCookie(c)
  return c.json({ ok: true })
})

authRouter.get('/me', async (c) => {
  const token = readSessionCookie(c)
  let userId: string | null = null

  if (token) {
    const session = await verifySession(token)
    userId = session?.sub ?? null
  }

  if (!userId && process.env.NODE_ENV === 'test') {
    userId = c.req.header('x-user-id') || null
  }

  if (!userId) return c.json({ user: null, workspaces: [] })

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (!user) {
    clearSessionCookie(c)
    return c.json({ user: null, workspaces: [] })
  }

  const workspaces_list = await listUserWorkspaces(userId)
  return c.json({
    user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin },
    workspaces: workspaces_list,
  })
})

// POST /auth/admin/setup — create admin user (protected by ADMIN_SETUP_SECRET)
authRouter.post('/admin/setup', adminSetupLimiter, async (c) => {
  const setupSecret = process.env.ADMIN_SETUP_SECRET
  if (!setupSecret) {
    return c.json({ error: 'Admin setup not configured. Set ADMIN_SETUP_SECRET env var.' }, 503)
  }

  const body = await c.req.json().catch(() => ({}))
  if (!body.secret || body.secret !== setupSecret) {
    return c.json({ error: 'Invalid setup secret.' }, 403)
  }

  const { email: rawEmail, name, password } = body
  if (!rawEmail || !password) {
    return c.json({ error: 'email and password are required.' }, 400)
  }

  if (typeof password !== 'string' || password.length < 8) {
    return c.json({ error: 'Password must be at least 8 characters.' }, 400)
  }

  const email = String(rawEmail).trim().toLowerCase()

  // Refuse if any admin already exists. The endpoint is for first-admin bootstrap only.
  const anyAdmin = await db.query.users.findFirst({ where: eq(users.isAdmin, true) })
  if (anyAdmin) {
    return c.json({ error: 'Admin user already exists.' }, 409)
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (existing) {
    return c.json({ error: 'User already exists.' }, 409)
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const [user] = await db.insert(users).values({ email, name: name || undefined, passwordHash, isAdmin: true }).returning()

  const workspaceId = await ensureDefaultWorkspace(user.id)
  await issueSession(c, user)

  return c.json({
    user: { id: user.id, email: user.email, name: user.name, isAdmin: true },
    workspaceId,
    message: 'Admin user created.',
  }, 201)
})

// --- helpers ---

async function issueSession(c: Context, user: { id: string; email: string }) {
  const token = await signSession({ sub: user.id, email: user.email })
  setSessionCookie(c, token)
}

async function ensureDefaultWorkspace(userId: string): Promise<string> {
  const membership = await db.query.workspaceMembers.findFirst({ where: eq(workspaceMembers.userId, userId) })
  if (membership) return membership.workspaceId

  const [workspace] = await db.insert(workspaces).values({ ownerId: userId, name: 'My Studio' }).returning()
  await db.insert(workspaceMembers).values({ workspaceId: workspace.id, userId, role: 'owner' })
  await db.insert(usageQuotas).values({ workspaceId: workspace.id }).onConflictDoNothing()
  return workspace.id
}

async function listUserWorkspaces(userId: string) {
  return db.select({
    id: workspaces.id,
    ownerId: workspaces.ownerId,
    name: workspaces.name,
    adultModeEnabled: workspaces.adultModeEnabled,
    role: workspaceMembers.role,
    createdAt: workspaces.createdAt,
    updatedAt: workspaces.updatedAt,
  })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, userId))
}
