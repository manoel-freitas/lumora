<script setup lang="ts">
defineProps<{ item: any }>()
</script>

<template>
  <div class="group relative cursor-pointer overflow-hidden rounded-xl aspect-square bg-white/5">
    <img
      v-if="item.url || item.thumbnailUrl"
      :src="item.thumbnailUrl || item.url"
      :alt="item.caption || 'Gallery item'"
      class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
    />
    <div v-else class="flex h-full w-full items-center justify-center text-zinc-600">
      <svg class="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
      </svg>
    </div>

    <!-- Hover overlay -->
    <div class="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
      <div class="flex flex-wrap items-center gap-1.5">
        <span v-if="item.type" class="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white">
          {{ item.type }}
        </span>
        <span v-if="item.platform" class="rounded-full bg-violet-500/60 px-2 py-0.5 text-xs font-medium text-white">
          {{ item.platform }}
        </span>
      </div>
      <p v-if="item.caption" class="mt-1 line-clamp-2 text-xs text-white/80">{{ item.caption }}</p>
    </div>
  </div>
</template>
