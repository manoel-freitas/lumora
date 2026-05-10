import { Hono } from 'hono'
import type { AppEnv } from '../../infra/auth'
import { listApprovalQueue } from '../content-assets/content-asset.repository'

export const approvalsRouter = new Hono<AppEnv>()

approvalsRouter.get('/', async (c) => c.json({ items: await listApprovalQueue(c.get('workspaceId')) }))
