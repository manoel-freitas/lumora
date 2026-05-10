export function useCampaigns() {
  const api = useApi()
  return {
    list: (params?: Record<string, unknown>) => api.get('/api/campaigns', params),
    get: (id: string) => api.get(`/api/campaigns/${id}`),
    create: (data: Record<string, any>) => api.post('/api/campaigns', data),
    update: (id: string, data: Record<string, any>) => api.put(`/api/campaigns/${id}`, data),
    remove: (id: string) => api.del(`/api/campaigns/${id}`),
  }
}
