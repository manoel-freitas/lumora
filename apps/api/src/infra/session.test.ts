import { describe, it, expect, beforeEach } from 'vitest'
import { signSession, verifySession } from './session'

describe('session', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = 'test-session-secret-at-least-16-chars'
  })

  it('signs and verifies a valid session', async () => {
    const token = await signSession({ sub: 'user-123', email: 'a@b.com' })
    const decoded = await verifySession(token)
    expect(decoded?.sub).toBe('user-123')
    expect(decoded?.email).toBe('a@b.com')
    expect(decoded?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
  })

  it('rejects tampered tokens', async () => {
    const token = await signSession({ sub: 'user-123', email: 'a@b.com' })
    const tampered = token.slice(0, -4) + 'xxxx'
    expect(await verifySession(tampered)).toBeNull()
  })

  it('rejects expired tokens', async () => {
    const token = await signSession({ sub: 'user-123', email: 'a@b.com' }, -10)
    expect(await verifySession(token)).toBeNull()
  })

  it('rejects garbage tokens', async () => {
    expect(await verifySession('not-a-jwt')).toBeNull()
    expect(await verifySession('')).toBeNull()
  })

  it('does not verify with a different secret', async () => {
    const token = await signSession({ sub: 'user-123', email: 'a@b.com' })
    process.env.SESSION_SECRET = 'different-secret-at-least-16-chars'
    expect(await verifySession(token)).toBeNull()
  })
})
