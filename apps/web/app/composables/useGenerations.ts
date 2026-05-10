export function useGenerations() {
  const api = useApi()
  const create = (data: Record<string, any>) => api.post('/api/generations', data)
  const get = (id: string) => api.get<Record<string, any>>(`/api/generations/${id}`)
  const list = (params?: Record<string, unknown>) => api.get('/api/generations', params)
  const cancel = (id: string) => api.post(`/api/generations/${id}/cancel`)
  const regenerate = (id: string) => api.post(`/api/generations/${id}/regenerate`)

  async function pollUntilDone(id: string, onUpdate?: (g: any) => void, intervalMs = 2000): Promise<any> {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const gen = await get(id)
          onUpdate?.(gen)

          if (['completed', 'failed', 'cancelled', 'expired', 'moderation_failed'].includes(gen.status)) {
            clearInterval(interval)

            if (gen.status === 'completed') resolve(gen)
            else reject(new Error(gen.error || gen.status))
          }
        } catch (e) {
          clearInterval(interval)
          reject(e)
        }
      }, intervalMs)
    })
  }

  return { create, get, list, cancel, regenerate, pollUntilDone }
}
