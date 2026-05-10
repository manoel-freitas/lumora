export default defineNuxtRouteMiddleware(async (to) => {
  // If already authenticated, redirect away from auth pages
  const auth = useAuth()
  await auth.fetchMe()
  if (auth.isAuthenticated.value) {
    return navigateTo('/')
  }
})