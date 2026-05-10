const PUBLIC_PATHS = new Set(['/login', '/signup', '/admin-setup'])

export default defineNuxtRouteMiddleware(async (to) => {
  if (PUBLIC_PATHS.has(to.path)) return

  const auth = useAuth()
  const ok = await auth.fetchMe()

  if (!ok) {
    return navigateTo('/login')
  }
})
