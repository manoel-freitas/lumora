import type { Context } from 'hono'
import type { ZodSchema } from 'zod'

export async function parseJson<T>(c: Context, schema: ZodSchema<T>): Promise<T | Response> {
  const body = await c.req.json().catch(() => null)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return c.json({ error: 'Validation failed', issues: parsed.error.flatten() }, 400)
  }

  return parsed.data
}

export function notFound(c: Context, resource = 'Resource') {
  return c.json({ error: `${resource} not found` }, 404)
}
