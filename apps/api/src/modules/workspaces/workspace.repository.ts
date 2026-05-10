import { and, eq } from 'drizzle-orm'
import { db } from '../../infra/db'
import { usageQuotas, users, workspaceMembers, workspaces } from '../../db/schema'

export async function listUserWorkspaces(userId: string) {
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

export async function userCanAccessWorkspace(userId: string, workspaceId: string) {
  const membership = await db.query.workspaceMembers.findFirst({
    where: and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.workspaceId, workspaceId)),
  })
  return Boolean(membership)
}

export async function findWorkspaceForUser(userId: string, workspaceId: string) {
  const canAccess = await userCanAccessWorkspace(userId, workspaceId)
  if (!canAccess) return null
  return db.query.workspaces.findFirst({ where: eq(workspaces.id, workspaceId) })
}

export async function createWorkspace(userId: string, data: { name: string }) {
  const [workspace] = await db.insert(workspaces).values({ ownerId: userId, name: data.name }).returning()
  await db.insert(workspaceMembers).values({ workspaceId: workspace.id, userId, role: 'owner' })
  await db.insert(usageQuotas).values({ workspaceId: workspace.id })
  return workspace
}

export async function updateWorkspaceForUser(userId: string, workspaceId: string, data: { name?: string; adultModeEnabled?: boolean }) {
  const workspace = await findWorkspaceForUser(userId, workspaceId)
  if (!workspace) return null

  const [updated] = await db.update(workspaces)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(workspaces.id, workspaceId))
    .returning()

  return updated
}

export async function addWorkspaceMember(workspaceId: string, data: { userId: string; role?: 'owner' | 'admin' | 'member' | 'viewer' }) {
  const user = await db.query.users.findFirst({ where: eq(users.id, data.userId) })
  if (!user) return null

  const role = data.role ?? 'member'
  const [member] = await db.insert(workspaceMembers)
    .values({ workspaceId, userId: data.userId, role })
    .onConflictDoUpdate({
      target: [workspaceMembers.workspaceId, workspaceMembers.userId],
      set: { role },
    })
    .returning()

  return member
}
