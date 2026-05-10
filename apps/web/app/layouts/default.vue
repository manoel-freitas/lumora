<script setup lang="ts">
const auth = useAuth()

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/characters', label: 'Characters' },
  { to: '/generate', label: 'Generate' },
  { to: '/approvals', label: 'Approvals' },
  { to: '/calendar', label: 'Calendar' },
]

function handleLogout() {
  auth.logout()
}
</script>

<template>
  <div class="min-h-screen bg-zinc-950 text-zinc-100">
    <header class="border-b border-white/10 bg-zinc-950/80">
      <nav class="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4">
        <NuxtLink to="/" class="text-lg font-semibold tracking-tight">Lumora</NuxtLink>
        <div class="flex flex-wrap gap-2 text-sm text-zinc-300">
          <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to" class="rounded-full px-3 py-1 hover:bg-white/10">
            {{ item.label }}
          </NuxtLink>
        </div>

        <!-- Auth controls -->
        <div class="ml-auto flex items-center gap-3">
          <template v-if="auth.user.value">
            <span class="text-sm text-zinc-400">{{ auth.user.value.email }}</span>
            <button
              @click="handleLogout"
              class="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
            >
              Sign out
            </button>
          </template>
          <template v-else>
            <NuxtLink to="/login" class="rounded-full bg-violet-600 px-3 py-1 text-xs text-white hover:bg-violet-500">
              Sign in
            </NuxtLink>
          </template>
        </div>
      </nav>
    </header>
    <main class="mx-auto max-w-7xl px-6 py-8">
      <slot />
    </main>
  </div>
</template>