import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { rateLimit, _resetRateLimits } from './rate-limit'

describe('rateLimit', () => {
  beforeEach(() => {
    _resetRateLimits()
    delete process.env.DISABLE_RATE_LIMIT
  })

  it('allows requests under the limit', async () => {
    const app = new Hono()
    app.post('/x', rateLimit({ name: 't1', windowMs: 60_000, max: 3 }), (c) => c.text('ok'))

    for (let i = 0; i < 3; i += 1) {
      const res = await app.request('/x', { method: 'POST', headers: { 'x-forwarded-for': '1.1.1.1' } })
      expect(res.status).toBe(200)
    }
  })

  it('returns 429 once limit exceeded', async () => {
    const app = new Hono()
    app.post('/x', rateLimit({ name: 't2', windowMs: 60_000, max: 2 }), (c) => c.text('ok'))

    await app.request('/x', { method: 'POST', headers: { 'x-forwarded-for': '2.2.2.2' } })
    await app.request('/x', { method: 'POST', headers: { 'x-forwarded-for': '2.2.2.2' } })
    const blocked = await app.request('/x', { method: 'POST', headers: { 'x-forwarded-for': '2.2.2.2' } })

    expect(blocked.status).toBe(429)
    expect(blocked.headers.get('Retry-After')).toBeTruthy()
  })

  it('isolates by ip', async () => {
    const app = new Hono()
    app.post('/x', rateLimit({ name: 't3', windowMs: 60_000, max: 1 }), (c) => c.text('ok'))

    const a1 = await app.request('/x', { method: 'POST', headers: { 'x-forwarded-for': '3.3.3.3' } })
    const b1 = await app.request('/x', { method: 'POST', headers: { 'x-forwarded-for': '4.4.4.4' } })
    expect(a1.status).toBe(200)
    expect(b1.status).toBe(200)

    const a2 = await app.request('/x', { method: 'POST', headers: { 'x-forwarded-for': '3.3.3.3' } })
    expect(a2.status).toBe(429)
  })

  it('disabled when DISABLE_RATE_LIMIT=true', async () => {
    process.env.DISABLE_RATE_LIMIT = 'true'
    const app = new Hono()
    app.post('/x', rateLimit({ name: 't4', windowMs: 60_000, max: 1 }), (c) => c.text('ok'))

    for (let i = 0; i < 5; i += 1) {
      const res = await app.request('/x', { method: 'POST', headers: { 'x-forwarded-for': '5.5.5.5' } })
      expect(res.status).toBe(200)
    }
  })
})
