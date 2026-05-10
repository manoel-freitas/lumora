export default defineNuxtPlugin(async () => {
  // Attempt session restore on every page load
  const auth = useAuth()
  await auth.fetchMe()
})