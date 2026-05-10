interface AuthUser {
  id: string
  email: string
  name?: string
  isAdmin?: boolean
  workspaceId?: string
}

interface Workspace {
  id: string
  name: string
  role: string
}

interface AuthState {
  user: AuthUser | null
  workspaces: Workspace[]
  workspaceId: string | null
}

const state = reactive<AuthState>({
  user: null,
  workspaces: [],
  workspaceId: null,
})

export { state }

export function useAuth() {
  const api = useApi()

  async function fetchMe() {
    try {
      const res = await api.get<{ user: AuthUser | null; workspaces: any[] }>('/api/auth/me')
      if (res.user) {
        state.user = res.user
        state.workspaces = res.workspaces ?? []
        if (!state.workspaceId && res.workspaces.length > 0) {
          state.workspaceId = res.workspaces[0].id
        }
        return true
      }
    } catch {}
    state.user = null
    state.workspaces = []
    state.workspaceId = null
    return false
  }

  async function login(email: string, password: string) {
    const res = await api.post<{
      user: AuthUser
      workspaces: any[]
      defaultWorkspaceId: string
    }>('/api/auth/login', { email, password })
    state.user = res.user
    state.workspaces = res.workspaces ?? []
    state.workspaceId = res.defaultWorkspaceId
    return res
  }

  async function signup(email: string, name: string, password: string) {
    const res = await api.post<{
      user: AuthUser
      workspaces: any[]
      defaultWorkspaceId: string
    }>('/api/auth/signup', { email, name, password })
    state.user = res.user
    state.workspaces = res.workspaces ?? []
    state.workspaceId = res.defaultWorkspaceId
    return res
  }

  async function logout() {
    await api.post('/api/auth/logout')
    state.user = null
    state.workspaces = []
    state.workspaceId = null
    await navigateTo('/login')
  }

  function setWorkspace(workspaceId: string) {
    state.workspaceId = workspaceId
  }

  const isAuthenticated = computed(() => !!state.user)

  return {
    user: computed(() => state.user),
    workspaces: computed(() => state.workspaces),
    workspaceId: computed(() => state.workspaceId),
    isAuthenticated,
    fetchMe,
    login,
    signup,
    logout,
    setWorkspace,
  }
}