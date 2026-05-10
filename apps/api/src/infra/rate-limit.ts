import type { Context, MiddlewareHandler } from 'hono'

type Bucket = { count: number; resetAt: number }

const stores = new Map<string, Map<string, Bucket>>()

export type RateLimitOptions = {
  name: string
  windowMs: number
  max: number
  keyFn?: (c: Context) => string | Promise<string>
}

function getStore(name: string): Map<string, Bucket> {
  let store = stores.get(name)
  if (!store) {
    store = new Map()
    stores.set(name, store)
  }
  return store
}

function defaultKey(c: Context): string {
  const fwd = c.req.header('x-forwarded-for')
  const ip = fwd?.split(',')[0]?.trim() || c.req.header('x-real-ip') || c.req.header('cf-connecting-ip') || 'anon'
  return ip
}

export function rateLimit(options: RateLimitOptions): MiddlewareHandler {
  const { name, windowMs, max, keyFn = defaultKey } = options
  const store = getStore(name)

  return async (c, next) => {
    if (process.env.DISABLE_RATE_LIMIT === 'true') return next()

    const key = await keyFn(c)
    const now = Date.now()
    const bucket = store.get(key)

    if (!bucket || bucket.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs })
      return next()
    }

    if (bucket.count >= max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000)
      c.header('Retry-After', String(retryAfter))
      return c.json({ error: 'Too many requests. Try again later.' }, 429)
    }

    bucket.count += 1
    return next()
  }
}

// Test/lifecycle helper
export function _resetRateLimits(): void {
  stores.clear()
}
