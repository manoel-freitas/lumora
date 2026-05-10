import { Hono } from 'hono'
import type { AppEnv } from '../infra/auth'

export function createStubRouter(resource: string) {
  const router = new Hono<AppEnv>()

  router.get('/', (c) => c.json({ resource, items: [] }))
  router.post('/', async (c) => c.json({ resource, received: await c.req.json().catch(() => ({})) }, 201))
  router.get('/:id', (c) => c.json({ resource, id: c.req.param('id') }))
  router.put('/:id', async (c) => c.json({ resource, id: c.req.param('id'), received: await c.req.json().catch(() => ({})) }))
  router.delete('/:id', (c) => c.json({ resource, id: c.req.param('id'), deleted: true }))

  return router
}
