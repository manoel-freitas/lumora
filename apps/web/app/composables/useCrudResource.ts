export function useCrudResource(resource: string) {
  const api = useApi()
  const base = `/api/${resource}`

  return {
    list: (params?: Record<string, unknown>) => api.get(base, params),
    get: (id: string) => api.get(`${base}/${id}`),
    create: (data: Record<string, any>) => api.post(base, data),
    update: (id: string, data: Record<string, any>) => api.put(`${base}/${id}`, data),
    remove: (id: string) => api.del(`${base}/${id}`),
  }
}
