<script setup lang="ts">
definePageMeta({ middleware: 'auth-guest', layout: false })

const secret = ref('')
const email = ref('')
const name = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

async function handleAdminSetup() {
  error.value = ''
  success.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }
  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters.'
    return
  }

  loading.value = true
  try {
    await $fetch('/api/auth/admin/setup', {
      method: 'POST',
      body: { secret: secret.value, email: email.value.trim(), name: name.value.trim(), password: password.value },
    })
    success.value = 'Admin user created! You can now sign in.'
    // Clear sensitive fields
    password.value = ''
    confirmPassword.value = ''
    secret.value = ''
  } catch (e: any) {
    error.value = e.data?.error ?? e.message ?? 'Setup failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold tracking-tight text-white">Lumora</h1>
        <p class="mt-2 text-sm text-zinc-400">Admin setup</p>
      </div>

      <div class="rounded-2xl border border-white/10 bg-white/5 p-8">
        <h2 class="text-xl font-semibold text-zinc-100">Create admin user</h2>
        <p class="mt-1 text-sm text-zinc-400">Use the server's ADMIN_SETUP_SECRET to create the first admin.</p>

        <form class="mt-6 space-y-4" @submit.prevent="handleAdminSetup">
          <div v-if="error" class="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {{ error }}
          </div>
          <div v-if="success" class="rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
            {{ success }}
          </div>

          <!-- Setup secret -->
          <div class="space-y-1.5">
            <label for="secret" class="text-sm text-zinc-300">Admin setup secret</label>
            <input
              id="secret"
              v-model="secret"
              type="password"
              placeholder="ADMIN_SETUP_SECRET value"
              required
              class="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
            />
          </div>

          <!-- Email -->
          <div class="space-y-1.5">
            <label for="email" class="text-sm text-zinc-300">Admin email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="admin@example.com"
              required
              autocomplete="email"
              class="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
            />
          </div>

          <!-- Name -->
          <div class="space-y-1.5">
            <label for="name" class="text-sm text-zinc-300">Name <span class="text-zinc-500">(optional)</span></label>
            <input
              id="name"
              v-model="name"
              type="text"
              placeholder="Admin name"
              autocomplete="name"
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
              placeholder="Min 8 characters"
              required
              minlength="8"
              autocomplete="new-password"
              class="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
            />
          </div>

          <!-- Confirm -->
          <div class="space-y-1.5">
            <label for="confirmPassword" class="text-sm text-zinc-300">Confirm password</label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              placeholder="Repeat password"
              required
              minlength="8"
              autocomplete="new-password"
              class="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
            />
          </div>

          <button
            type="submit"
            :disabled="loading || password.length < 8"
            class="w-full rounded-lg bg-violet-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            <span v-if="loading">Creating admin…</span>
            <span v-else>Create admin user</span>
          </button>
        </form>

        <p class="mt-4 text-center text-sm text-zinc-500">
          <NuxtLink to="/login" class="text-violet-400 hover:text-violet-300">Back to sign in</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>