export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],

  runtimeConfig: {
    honoApiUrl: process.env.HONO_API_URL || 'http://localhost:3001',
    public: {
      apiBase: '/api',
    },
  },
})
