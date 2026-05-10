<script setup lang="ts">
const statusFilter = shallowRef('all')
const { data, pending, error } = await useApiFetch<{ items: any[] }>('/api/campaigns')

const statusTabs = ['all', 'draft', 'active', 'paused', 'archived']

const filteredCampaigns = computed(() => {
  const items = data.value?.items || []
  if (statusFilter.value === 'all') return items
  return items.filter((campaign) => campaign.status === statusFilter.value)
})
</script>

<template>
  <section class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="text-sm uppercase tracking-[0.3em] text-violet-300">Campaign workspace</p>
        <h1 class="mt-2 text-3xl font-bold">Campaigns</h1>
      </div>
      <NuxtLink to="/campaigns/new" class="rounded-full bg-violet-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-violet-300">
        New Campaign
      </NuxtLink>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="tab in statusTabs"
        :key="tab"
        type="button"
        class="rounded-full px-3 py-1.5 text-sm capitalize transition"
        :class="statusFilter === tab ? 'bg-violet-400 text-zinc-950' : 'bg-white/5 text-zinc-300 hover:bg-white/10'"
        @click="statusFilter = tab"
      >
        {{ tab }}
      </button>
    </div>

    <div v-if="pending" class="rounded-2xl border border-white/10 bg-white/5 p-8 text-zinc-400">Loading campaigns…</div>
    <div v-else-if="error" class="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-red-300">Failed to load campaigns.</div>
    <div v-else-if="filteredCampaigns.length" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <CampaignCard v-for="campaign in filteredCampaigns" :key="campaign.id" :campaign="campaign" />
    </div>
    <div v-else class="rounded-2xl border border-dashed border-white/10 p-12 text-center">
      <p class="text-zinc-300">No campaigns found.</p>
      <NuxtLink to="/campaigns/new" class="mt-2 inline-block text-sm text-violet-300 hover:text-violet-200">
        Plan first campaign
      </NuxtLink>
    </div>
  </section>
</template>
