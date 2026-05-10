<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const api = useApi()
const campaignId = computed(() => String(route.params.id))

const { data: campaign, pending, error, refresh } = await useApiFetch<any>(() => `/api/campaigns/${campaignId.value}`)

const mutating = shallowRef(false)
const mutationError = shallowRef('')
const ideaForm = reactive({ title: '', description: '', hook: '', captionDraft: '', hashtags: '' })

const statusClass = computed(() => {
  const status = campaign.value?.status || 'draft'
  const classes: Record<string, string> = {
    draft: 'bg-zinc-500/20 text-zinc-300',
    active: 'bg-emerald-500/20 text-emerald-300',
    paused: 'bg-amber-500/20 text-amber-300',
    archived: 'bg-zinc-700/60 text-zinc-400',
  }
  return classes[status] || classes.draft
})

async function updateStatus(status: string) {
  if (!campaign.value) return
  mutating.value = true
  mutationError.value = ''
  try {
    await api.put(`/api/campaigns/${campaignId.value}`, { status })
    await refresh()
  } catch (e: any) {
    mutationError.value = e?.data?.error || e?.message || 'Failed to update campaign'
  } finally {
    mutating.value = false
  }
}

async function addIdea() {
  if (!campaign.value || !ideaForm.title.trim()) return
  mutating.value = true
  mutationError.value = ''
  try {
    await api.post(`/api/campaigns/${campaignId.value}/ideas`, {
      title: ideaForm.title.trim(),
      description: ideaForm.description.trim() || undefined,
      hook: ideaForm.hook.trim() || undefined,
      captionDraft: ideaForm.captionDraft.trim() || undefined,
      hashtags: ideaForm.hashtags.split(',').map((tag) => tag.trim()).filter(Boolean),
      platform: campaign.value.platform,
    })
    ideaForm.title = ''
    ideaForm.description = ''
    ideaForm.hook = ''
    ideaForm.captionDraft = ''
    ideaForm.hashtags = ''
    await refresh()
  } catch (e: any) {
    mutationError.value = e?.data?.error || e?.message || 'Failed to add idea'
  } finally {
    mutating.value = false
  }
}

async function generateIdea() {
  mutating.value = true
  mutationError.value = ''
  try {
    await api.post(`/api/campaigns/${campaignId.value}/generate-ideas`, {})
    await refresh()
  } catch (e: any) {
    mutationError.value = e?.data?.error || e?.message || 'Failed to generate idea'
  } finally {
    mutating.value = false
  }
}

async function generateAsset() {
  mutating.value = true
  mutationError.value = ''
  try {
    const generation = await api.post<any>(`/api/campaigns/${campaignId.value}/generate-assets`, { type: 'image' })
    await router.push(`/generate?generationId=${generation.id}`)
  } catch (e: any) {
    mutationError.value = e?.data?.error || e?.message || 'Failed to queue generation'
  } finally {
    mutating.value = false
  }
}

async function deleteCampaign() {
  if (!confirm('Delete this campaign? This cannot be undone.')) return
  mutating.value = true
  mutationError.value = ''
  try {
    await api.del(`/api/campaigns/${campaignId.value}`)
    await router.push('/campaigns')
  } catch (e: any) {
    mutationError.value = e?.data?.error || e?.message || 'Failed to delete campaign'
  } finally {
    mutating.value = false
  }
}
</script>

<template>
  <section class="space-y-6">
    <nav class="text-sm text-zinc-400">
      <NuxtLink to="/campaigns" class="hover:text-zinc-200">Campaigns</NuxtLink>
      <span class="mx-2">/</span>
      <span class="text-zinc-200">{{ campaign?.name || 'Campaign' }}</span>
    </nav>

    <div v-if="pending" class="rounded-2xl border border-white/10 bg-white/5 p-8 text-zinc-400">Loading campaign…</div>
    <div v-else-if="error || !campaign" class="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-red-300">Campaign not found.</div>

    <template v-else>
      <div class="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-sm uppercase tracking-[0.3em] text-violet-300">{{ campaign.platform }}</p>
            <h1 class="mt-2 text-3xl font-bold">{{ campaign.name }}</h1>
            <p class="mt-3 max-w-3xl text-zinc-400">{{ campaign.goal || 'No goal set.' }}</p>
          </div>
          <span class="rounded-full px-3 py-1 text-sm font-medium" :class="statusClass">{{ campaign.status }}</span>
        </div>

        <div class="mt-6 flex flex-wrap gap-2">
          <button v-for="status in ['active', 'paused', 'archived']" :key="status" type="button" :disabled="mutating" class="rounded-full bg-white/10 px-3 py-1.5 text-sm capitalize text-zinc-200 hover:bg-white/15 disabled:opacity-60" @click="updateStatus(status)">
            {{ status }}
          </button>
          <button type="button" :disabled="mutating" class="rounded-full bg-red-500/10 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/20 disabled:opacity-60" @click="deleteCampaign">
            Delete
          </button>
        </div>
      </div>

      <div v-if="mutationError" class="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{{ mutationError }}</div>

      <div class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section class="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-xl font-semibold">Content ideas</h2>
            <button type="button" :disabled="mutating" class="rounded-full bg-violet-400 px-3 py-1.5 text-sm font-semibold text-zinc-950 hover:bg-violet-300 disabled:opacity-60" @click="generateIdea">
              Generate idea
            </button>
          </div>

          <form class="space-y-3 rounded-xl border border-white/10 bg-zinc-950/60 p-4" @submit.prevent="addIdea">
            <input v-model="ideaForm.title" class="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-violet-400" placeholder="Idea title">
            <textarea v-model="ideaForm.description" rows="3" class="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-violet-400" placeholder="Brief description" />
            <input v-model="ideaForm.hook" class="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-violet-400" placeholder="Hook">
            <input v-model="ideaForm.captionDraft" class="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-violet-400" placeholder="Caption draft">
            <input v-model="ideaForm.hashtags" class="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-violet-400" placeholder="#virtualinfluencer, #fashionportrait">
            <button type="submit" :disabled="mutating || !ideaForm.title.trim()" class="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-white/15 disabled:opacity-60">
              Add idea
            </button>
          </form>

          <div v-if="campaign.ideas?.length" class="space-y-3">
            <article v-for="idea in campaign.ideas" :key="idea.id" class="rounded-xl border border-white/10 bg-zinc-950/60 p-4">
              <h3 class="font-medium text-zinc-100">{{ idea.title }}</h3>
              <p v-if="idea.description" class="mt-1 text-sm text-zinc-400">{{ idea.description }}</p>
              <p v-if="idea.hook" class="mt-2 text-sm text-violet-300">{{ idea.hook }}</p>
            </article>
          </div>
          <p v-else class="text-sm text-zinc-500">No ideas yet. Add one or generate a starter idea.</p>
        </section>

        <section class="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-xl font-semibold">Assets</h2>
            <button type="button" :disabled="mutating" class="rounded-full bg-violet-400 px-3 py-1.5 text-sm font-semibold text-zinc-950 hover:bg-violet-300 disabled:opacity-60" @click="generateAsset">
              Queue image
            </button>
          </div>

          <div v-if="campaign.assets?.length" class="space-y-3">
            <article v-for="asset in campaign.assets" :key="asset.id" class="rounded-xl border border-white/10 bg-zinc-950/60 p-4 text-sm">
              <div class="flex items-center justify-between gap-3">
                <span class="text-zinc-200">{{ asset.assetType }}</span>
                <span class="rounded-full bg-white/10 px-2 py-1 text-xs text-zinc-300">{{ asset.status }}</span>
              </div>
              <p class="mt-2 text-zinc-500">Safety: {{ asset.safetyRating || 'pending' }}</p>
            </article>
          </div>
          <p v-else class="text-sm text-zinc-500">No assets yet. Queue generation from campaign brief.</p>
        </section>
      </div>
    </template>
  </section>
</template>
