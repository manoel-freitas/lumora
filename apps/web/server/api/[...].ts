import { joinURL } from 'ufo'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const path = event.path.replace('/api', '')
  const target = joinURL(config.honoApiUrl, path)

  return proxyRequest(event, target)
})
