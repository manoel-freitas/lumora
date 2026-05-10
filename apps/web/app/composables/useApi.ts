import { state } from './useAuth'

function buildHeaders(): Record<string, string> {
  const h: Record<string, string> = {}
  if (state.workspaceId) h['x-workspace-id'] = state.workspaceId
  if (import.meta.server) {
    const reqHeaders = useRequestHeaders(['cookie'])
    if (reqHeaders.cookie) h.cookie = reqHeaders.cookie
  }
  return h
}

export function useApiFetch<T>(url: string | (() => string), opts?: Parameters<typeof useFetch<T>>[1]) {
  return useFetch<T>(url, {
    ...opts,
    headers: computed(() => ({ ...buildHeaders(), ...(opts?.headers as Record<string, string> | undefined) })),
    credentials: 'include',
  })
}

export function useApi() {
  const headers = computed(() => buildHeaders())

  const get = <T>(url: string, query?: Record<string, unknown>) =>
    $fetch<T>(url, { query, headers: headers.value, credentials: 'include' })

  const post = <T>(url: string, body?: Record<string, any>) =>
    $fetch<T>(url, { method: 'POST', body, headers: headers.value, credentials: 'include' })

  const put = <T>(url: string, body?: Record<string, any>) =>
    $fetch<T>(url, { method: 'PUT', body, headers: headers.value, credentials: 'include' })

  const del = <T>(url: string) =>
    $fetch<T>(url, { method: 'DELETE', headers: headers.value, credentials: 'include' })

  const upload = <T>(url: string, body: FormData) =>
    $fetch<T>(url, { method: 'POST', body, headers: headers.value, credentials: 'include' })

  return { get, post, put, del, upload }
}
