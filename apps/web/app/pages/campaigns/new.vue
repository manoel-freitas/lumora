<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const api = useApi()
const submitting = shallowRef(false)
const error = shallowRef('')

const characterId = route.query.characterId as string | undefined

async function onSubmit(values: Record<string, unknown>) {
  submitting.value = true
  error.value = ''
  try {
    const campaign = await api.post<any>('/api/campaigns', values)
    await router.push(`/campaigns/${campaign.id}`)
  } catch (e: any) {
    error.value = e?.data?.error || e?.data?.message || e?.message || 'Failed to create campaign'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="space-y-6">
    <nav class="text-sm text-zinc-400">
      <NuxtLink to="/campaigns" class="hover:text-zinc-200">Campaigns</NuxtLink>
      <span class="mx-2">/</span>
      <span class="text-zinc-200">New</span>
    </nav>

    <div>
      <p class="text-sm uppercase tracking-[0.3em] text-violet-300">Campaign brief</p>
      <h1 class="mt-2 text-3xl font-bold">Create Campaign</h1>
      <p class="mt-2 max-w-2xl text-zinc-400">Plan content around a character, platform, and production goal.</p>
    </div>

    <div v-if="error" class="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      {{ error }}
    </div>

    <CampaignForm :character-id="characterId" submit-label="Create campaign" :submitting="submitting" @submit="onSubmit" />
  </section>
</template>
