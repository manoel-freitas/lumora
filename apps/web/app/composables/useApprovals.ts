export function useApprovals() {
  const api = useApi()
  return { list: (params?: Record<string, unknown>) => api.get('/api/approvals', params) }
}
