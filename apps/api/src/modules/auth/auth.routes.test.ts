import { describe, it, expect, vi, beforeEach } from 'vitest'
import { _resetRateLimits } from '../../infra/rate-limit'

// Mock DB before importing app
const usersStore = new Map<string, any>()
const workspacesStore = new Map<string, any>()
const membersStore = new Map<string, any>()
const quotasStore = new Map<string, any>()

let idCounter = 1
const nextId = () => `id-${idCounter++}`

vi.mock('../../infra/db', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(async ({ where }: any) => {
          const cond = where?.queryChunks ?? where
          for (const u of usersStore.values()) {
            if ((cond as any).__matchEmail && u.email === (cond as any).__matchEmail) return u
            if ((cond as any).__matchId && u.id === (cond as any).__matchId) return u
            if ((cond as any).__matchIsAdmin === true && u.isAdmin === true) return u
          }
          return undefined
        }),
      },
      workspaceMembers: {
        findFirst: vi.fn(async ({ where }: any) => {
          for (const m of membersStore.values()) {
            if ((where as any).__matchUserId && m.userId === (where as any).__matchUserId) return m
          }
          return undefined
        }),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
    select: vi.fn(),
  },
}))

// Replace eq with markers we can inspect
vi.mock('drizzle-orm', async (orig) => {
  const actual = await orig()
  return {
    ...(actual as any),
    eq: (col: any, val: any) => {
      const colName = col?.name || ''
      if (colName === 'email') return { __matchEmail: val }
      if (colName === 'id') return { __matchId: val }
      if (colName === 'user_id') return { __matchUserId: val }
      if (colName === 'workspace_id') return { __matchWorkspaceId: val }
      if (colName === 'is_admin') return { __matchIsAdmin: val }
      return { __unknown: val, col: colName }
    },
    and: (...args: any[]) => Object.assign({}, ...args),
  }
})

import { db } from '../../infra/db'

// Wire insert/update/select to in-memory stores
;(db.insert as any).mockImplementation((table: any) => ({
  values: (vals: any) => {
    const onConflictDoNothing = () => undefined
    const returning = async () => {
      const tName = table?.[Symbol.for('drizzle:Name')] || table?._?.name || tableName(table)
      const row = { id: nextId(), createdAt: new Date(), updatedAt: new Date(), ...vals }
      if (tName === 'users') {
        usersStore.set(row.id, row)
      } else if (tName === 'workspaces') {
        workspacesStore.set(row.id, row)
      } else if (tName === 'workspace_members') {
        membersStore.set(row.id, row)
      } else if (tName === 'usage_quotas') {
        quotasStore.set(row.id, row)
      }
      return [row]
    }
    return {
      returning,
      onConflictDoNothing: () => ({ returning }),
    }
  },
}))

;(db.update as any).mockImplementation((table: any) => ({
  set: (vals: any) => ({
    where: (cond: any) => ({
      returning: async () => {
        for (const u of usersStore.values()) {
          if (cond.__matchId && u.id === cond.__matchId) {
            Object.assign(u, vals)
            return [u]
          }
        }
        return []
      },
    }),
  }),
}))

;(db.select as any).mockImplementation(() => ({
  from: () => ({
    innerJoin: () => ({
      where: async () => [],
    }),
  }),
}))

function tableName(table: any): string {
  const sym = Object.getOwnPropertySymbols(table || {}).find((s) => String(s).includes('Name'))
  return sym ? table[sym] : ''
}

import { app } from '../../app'

beforeEach(() => {
  usersStore.clear()
  workspacesStore.clear()
  membersStore.clear()
  quotasStore.clear()
  idCounter = 1
  process.env.SESSION_SECRET = 'test-session-secret-at-least-16-chars'
  process.env.NODE_ENV = 'test'
  _resetRateLimits()
})

describe('Auth routes', () => {
  it('signup returns user + sets session cookie', async () => {
    const res = await app.request('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'New@User.com', password: 'password123', name: 'Bob' }),
    })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.user.email).toBe('new@user.com')
    expect(body.defaultWorkspaceId).toBeDefined()

    const setCookie = res.headers.get('set-cookie') || ''
    expect(setCookie).toContain('lumora_session=')
    expect(setCookie.toLowerCase()).toContain('httponly')
  })

  it('signup rejects when email already has password', async () => {
    await app.request('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com', password: 'password123' }),
    })

    const dup = await app.request('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com', password: 'password123' }),
    })

    expect(dup.status).toBe(409)
  })

  it('login succeeds with valid credentials and sets cookie', async () => {
    await app.request('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com', password: 'password123' }),
    })

    const res = await app.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'A@B.com', password: 'password123' }),
    })

    expect(res.status).toBe(200)
    const setCookie = res.headers.get('set-cookie') || ''
    expect(setCookie).toContain('lumora_session=')
  })

  it('login rejects bad password', async () => {
    await app.request('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com', password: 'password123' }),
    })

    const res = await app.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com', password: 'wrongpassword' }),
    })

    expect(res.status).toBe(401)
  })

  it('logout clears session cookie', async () => {
    const res = await app.request('/auth/logout', { method: 'POST' })
    expect(res.status).toBe(200)
    const setCookie = res.headers.get('set-cookie') || ''
    expect(setCookie.toLowerCase()).toContain('lumora_session=')
    // deleteCookie sets Max-Age=0 or expires in past
    expect(setCookie).toMatch(/Max-Age=0|expires=/i)
  })

  it('/me returns null user without session', async () => {
    const res = await app.request('/auth/me')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.user).toBeNull()
  })

  it('admin/setup rejects when ADMIN_SETUP_SECRET unset', async () => {
    delete process.env.ADMIN_SETUP_SECRET
    const res = await app.request('/auth/admin/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: 'x', email: 'admin@x.com', password: 'password123' }),
    })
    expect(res.status).toBe(503)
  })

  it('admin/setup rejects bad secret', async () => {
    process.env.ADMIN_SETUP_SECRET = 'real-secret'
    const res = await app.request('/auth/admin/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: 'wrong', email: 'admin@x.com', password: 'password123' }),
    })
    expect(res.status).toBe(403)
  })

  it('login rate-limits after 10 attempts/min from same IP', async () => {
    const headers = { 'Content-Type': 'application/json', 'x-forwarded-for': '9.9.9.9' }
    for (let i = 0; i < 10; i += 1) {
      await app.request('/auth/login', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: 'no@one.com', password: 'password123' }),
      })
    }
    const blocked = await app.request('/auth/login', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email: 'no@one.com', password: 'password123' }),
    })
    expect(blocked.status).toBe(429)
  })

  it('admin/setup creates first user with valid secret', async () => {
    process.env.ADMIN_SETUP_SECRET = 'real-secret'
    const res = await app.request('/auth/admin/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: 'real-secret', email: 'admin@x.com', password: 'password123' }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.user.email).toBe('admin@x.com')
    expect(body.user.isAdmin).toBe(true)
    expect(body.workspaceId).toBeDefined()
  })

  it('admin/setup blocks second admin (bootstrap is one-shot)', async () => {
    process.env.ADMIN_SETUP_SECRET = 'real-secret'
    await app.request('/auth/admin/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: 'real-secret', email: 'admin@x.com', password: 'password123' }),
    })
    const second = await app.request('/auth/admin/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: 'real-secret', email: 'other@x.com', password: 'password123' }),
    })
    expect(second.status).toBe(409)
  })
})
