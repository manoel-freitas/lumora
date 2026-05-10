<script setup lang="ts">
interface Campaign {
  id: string
  name: string
  goal?: string | null
  platform: string
  contentRating: string
  status: string
  startsAt?: string | null
  endsAt?: string | null
  ideas?: unknown[]
  assets?: unknown[]
}

const props = defineProps<{ campaign: Campaign }>()

const statusClass = computed(() => {
  const classes: Record<string, string> = {
    draft: 'bg-zinc-500/20 text-zinc-300',
    active: 'bg-emerald-500/20 text-emerald-300',
    paused: 'bg-amber-500/20 text-amber-300',
    archived: 'bg-zinc-700/60 text-zinc-400',
  }
  return classes[props.campaign.status] || classes.draft
})

const dateRange = computed(() => {
  const start = props.campaign.startsAt ? new Date(props.campaign.startsAt).toLocaleDateString() : null
  const end = props.campaign.endsAt ? new Date(props.campaign.endsAt).toLocaleDateString() : null
  if (start && end) return `${start} → ${end}`
  if (start) return `Starts ${start}`
  if (end) return `Ends ${end}`
  return 'No date range'
})
</script>

<template>
  <NuxtLink
    :to="`/campaigns/${campaign.id}`"
    class="block rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-violet-400/30"
  >
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 class="text-lg font-semibold text-zinc-100">{{ campaign.name }}</h3>
        <p class="mt-1 line-clamp-2 text-sm text-zinc-400">{{ campaign.goal || 'No campaign goal set.' }}</p>
      </div>
      <span class="rounded-full px-2.5 py-1 text-xs font-medium" :class="statusClass">{{ campaign.status }}</span>
    </div>

    <div class="mt-4 flex flex-wrap gap-2 text-xs">
      <span class="rounded-full bg-violet-500/15 px-2.5 py-1 text-violet-300">{{ campaign.platform }}</span>
      <span class="rounded-full bg-white/10 px-2.5 py-1 text-zinc-300">{{ campaign.contentRating }}</span>
    </div>

    <div class="mt-4 flex items-center justify-between text-xs text-zinc-500">
      <span>{{ dateRange }}</span>
      <span>{{ campaign.ideas?.length || 0 }} ideas · {{ campaign.assets?.length || 0 }} assets</span>
    </div>
  </NuxtLink>
</template>
