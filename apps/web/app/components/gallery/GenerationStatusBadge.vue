<script setup lang="ts">
const props = defineProps<{ status: string }>()

const colorMap: Record<string, string> = {
  completed: 'bg-emerald-500/20 text-emerald-400',
  processing: 'bg-amber-500/20 text-amber-400',
  failed: 'bg-red-500/20 text-red-400',
  queued: 'bg-zinc-500/20 text-zinc-400',
  cancelled: 'bg-zinc-500/20 text-zinc-400',
  expired: 'bg-zinc-500/20 text-zinc-400',
  moderation_failed: 'bg-red-500/20 text-red-400',
}

const classes = computed(() => colorMap[props.status] ?? 'bg-zinc-500/20 text-zinc-400')
</script>

<template>
  <span :class="['inline-flex rounded-full px-2 py-0.5 text-xs font-medium', classes]">
    {{ status }}
  </span>
</template>
