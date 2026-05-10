<script setup lang="ts">
interface Character {
  id: string
  name: string
  description: string | null
  triggerWord: string | null
  isAdult: boolean
  createdAt: string
  updatedAt: string
}

defineProps<{ character: Character }>()

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function truncate(str: string | null, len: number) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '…' : str
}
</script>

<template>
  <NuxtLink
    :to="`/characters/${character.id}`"
    class="block rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-violet-400/30"
  >
    <h3 class="text-lg font-semibold text-zinc-100">{{ character.name }}</h3>
    <p v-if="character.description" class="mt-1 text-sm text-zinc-400">
      {{ truncate(character.description, 120) }}
    </p>
    <div class="mt-3 flex flex-wrap items-center gap-2">
      <span
        v-if="character.triggerWord"
        class="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-medium text-violet-300"
      >
        {{ character.triggerWord }}
      </span>
      <span
        v-if="character.isAdult"
        class="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-medium text-rose-300"
      >
        18+
      </span>
      <span class="ml-auto text-xs text-zinc-500">
        {{ formatDate(character.createdAt) }}
      </span>
    </div>
  </NuxtLink>
</template>
