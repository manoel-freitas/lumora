import { serve } from '@hono/node-server'
import { app } from './app'

serve({ fetch: app.fetch, port: Number(process.env.PORT || process.env.API_PORT || 3001) }, (info) => {
  console.log(`API running on http://localhost:${info.port}`)
})

export default app
