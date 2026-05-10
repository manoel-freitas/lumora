<script setup lang="ts">
definePageMeta({ middleware: 'auth-guest' })

const auth = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''
  loading.value = true

  try {
    await auth.login(email.value.trim(), password.value)
    await router.push('/')
  } catch (e: any) {
    error.value = e.data?.message ?? e.message ?? 'Sign in failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
    <div class="w-full max-w-md">
      <!-- Logo / wordmark -->
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold tracking-tight text-white">Lumora</h1>
        <p class="mt-2 text-sm text-zinc-400">AI influencer content studio</p>
      </div>

      <!-- Form card -->
      <div class="rounded-2xl border border-white/10 bg-white/5 p-8">
        <h2 class="text-xl font-semibold text-zinc-100">Sign in</h2>
        <p class="mt-1 text-sm text-zinc-400">Enter your credentials to continue</p>

        <form class="mt-6 space-y-4" @submit.prevent="handleLogin">
          <!-- Error -->
          <div v-if="error" class="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {{ error }}
          </div>

          <!-- Email -->
          <div class="space-y-1.5">
            <label for="email" class="text-sm text-zinc-300">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="you@example.com"
              required
              autocomplete="email"
              class="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
            />
          </div>

          <!-- Password -->
          <div class="space-y-1.5">
            <label for="password" class="text-sm text-zinc-300">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              required
              minlength="8"
              autocomplete="current-password"
              class="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
            />
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="loading || !email.trim() || password.length < 8"
            class="w-full rounded-lg bg-violet-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            <span v-if="loading">Signing in…</span>
            <span v-else>Sign in</span>
          </button>
        </form>

        <p class="mt-4 text-center text-sm text-zinc-400">
          No account?
          <NuxtLink to="/signup" class="text-violet-400 hover:text-violet-300">Create one</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>