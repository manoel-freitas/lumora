<script setup lang="ts">
const { data, pending, error, refresh } = await useApiFetch<{ items: any[] }>('/api/characters')
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold">Characters</h1>
      <NuxtLink
        to="/characters/new"
        class="rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-400"
      >
        New Character
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="py-20 text-center text-zinc-500">Loading characters…</div>

    <!-- Error -->
    <div v-else-if="error" class="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center text-rose-300">
      Failed to load characters.
      <button class="mt-2 text-sm underline" @click="refresh()">Retry</button>
    </div>

    <!-- Empty -->
    <div
      v-else-if="!data?.items?.length"
      class="rounded-2xl border border-white/10 bg-white/5 p-10 text-center"
    >
      <p class="text-zinc-400">No characters yet.</p>
      <NuxtLink
        to="/characters/new"
        class="mt-3 inline-block text-sm font-medium text-violet-400 hover:text-violet-300"
      >
        Create your first character →
      </NuxtLink>
    </div>

    <!-- Grid -->
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <CharacterCard v-for="char in data.items" :key="char.id" :character="char" />
    </div>
  </section>
</template>
