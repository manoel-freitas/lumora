import { describe, it, expect, vi, beforeEach } from 'vitest'
import { app } from '../../app'

vi.mock('../../infra/r2', () => ({
  uploadToR2: vi.fn().mockResolvedValue({
    key: 'workspaces/ws-test/uploads/fake-uuid.jpg',
    bucket: 'lumora-private',
    url: undefined,
  }),
  getSignedR2Url: vi.fn().mockResolvedValue('https://signed.example.com/media?token=abc'),
  deleteFromR2: vi.fn().mockResolvedValue(undefined),
}))

// Mock auth to bypass DB lookups
vi.mock('../../infra/auth', () => {
  const { createMiddleware } = require('hono/factory')
  const mockAuth = createMiddleware(async (c: any, next: any) => {
    c.set('user', { id: 'test-user', email: 'test@test.com' })
    c.set('workspaceId', c.req.header('x-workspace-id') || 'ws-test')
    await next()
  })
  return {
    requireAuth: mockAuth,
    requireWorkspace: mockAuth,
  }
})

describe('Storage routes', () => {
  const headers = { 'x-user-id': 'test-user', 'x-workspace-id': 'ws-test' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('POST /storage/upload rejects missing file', async () => {
    const res = await app.request('/storage/upload', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'multipart/form-data' },
    })
    expect(res.status).toBe(400)
  })

  it('POST /storage/upload accepts valid JPEG', async () => {
    const formData = new FormData()
    const blob = new Blob([new Uint8Array(1024)], { type: 'image/jpeg' })
    formData.append('file', blob, 'photo.jpg')

    const res = await app.request('/storage/upload', {
      method: 'POST',
      headers,
      body: formData,
    })

    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.key).toContain('workspaces/')
    expect(json.contentType).toBe('image/jpeg')
  })

  it('POST /storage/upload rejects unsupported type', async () => {
    const formData = new FormData()
    const blob = new Blob([new Uint8Array(1024)], { type: 'image/gif' })
    formData.append('file', blob, 'anim.gif')

    const res = await app.request('/storage/upload', {
      method: 'POST',
      headers,
      body: formData,
    })

    expect(res.status).toBe(400)
  })

  it('GET /storage/signed-url returns signed URL', async () => {
    const res = await app.request(
      '/storage/signed-url?key=generations/test.png&bucket=lumora-private',
      { headers },
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.url).toBe('https://signed.example.com/media?token=abc')
  })

  it('GET /storage/signed-url rejects missing bucket', async () => {
    const res = await app.request(
      '/storage/signed-url?key=generations/test.png',
      { headers },
    )

    expect(res.status).toBe(400)
  })

  it('DELETE /storage/:key deletes object', async () => {
    const res = await app.request(
      '/storage/generations/test.png?bucket=lumora-private',
      { method: 'DELETE', headers },
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.deleted).toBe(true)
  })

  it('DELETE /storage/:key rejects path traversal key', async () => {
    const res = await app.request(
      '/storage/..%2F..%2Fetc%2Fpasswd?bucket=lumora-private',
      { method: 'DELETE', headers },
    )

    expect(res.status).toBe(400)
  })
})
