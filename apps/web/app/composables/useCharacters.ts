export function useCharacters() {
  const api = useApi()
  return {
    list: (params?: Record<string, unknown>) => api.get('/api/characters', params),
    get: (id: string) => api.get(`/api/characters/${id}`),
    create: (data: Record<string, any>) => api.post('/api/characters', data),
    update: (id: string, data: Record<string, any>) => api.put(`/api/characters/${id}`, data),
    remove: (id: string) => api.del(`/api/characters/${id}`),
  }
}
