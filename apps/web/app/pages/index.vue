<script setup lang="ts">
const api = useApi()

interface Campaign { id: string; name: string; status: string }
interface ApprovalAsset { id: string; url?: string; platform?: string; status: string; type?: string }
interface ContentPlan { id: string; caption?: string; platform?: string; plannedFor?: string }
interface UsageSummary { imageCount: number; videoCount: number; estimatedCostUsd: string | number }

const campaigns = ref<Campaign[]>([])
const approvals = ref<ApprovalAsset[]>([])
const contentPlans = ref<ContentPlan[]>([])
const usage = ref<UsageSummary | null>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const [campRes, apprRes, planRes, usageRes] = await Promise.allSettled([
      api.get<{ items: Campaign[] }>('/api/campaigns'),
      api.get<{ items: ApprovalAsset[] }>('/api/approvals'),
      api.get<{ items: ContentPlan[] }>('/api/content-plans'),
      api.get<UsageSummary>('/api/usage/current-month'),
    ])

    if (campRes.status === 'fulfilled') campaigns.value = campRes.value.items ?? []
    if (apprRes.status === 'fulfilled') approvals.value = apprRes.value.items ?? []
    if (planRes.status === 'fulfilled') contentPlans.value = planRes.value.items ?? []
    if (usageRes.status === 'fulfilled') usage.value = usageRes.value
  } catch (e: any) {
    error.value = e.message ?? 'Failed to load dashboard'
  } finally {
    loading.value = false
  }
})

const pendingApprovals = computed(() => approvals.value.filter(a => a.status === 'generated' || a.status === 'reviewed'))

const cards = computed(() => [
  { label: 'Active campaigns', value: String(campaigns.value.length), color: 'text-violet-400' },
  { label: 'Pending approvals', value: String(pendingApprovals.value.length), color: 'text-amber-400' },
  { label: 'Content planned', value: String(contentPlans.value.length), color: 'text-emerald-400' },
  { label: 'Monthly spend', value: usage.value ? `$${Number(usage.value.estimatedCostUsd).toFixed(2)}` : '$0.00', color: 'text-sky-400' },
])
</script>

<template>
  <section class="space-y-8">
    <div>
      <p class="text-sm uppercase tracking-[0.3em] text-violet-300">AI influencer studio</p>
      <h1 class="mt-3 text-4xl font-bold">Dashboard</h1>
      <p class="mt-2 max-w-2xl text-zinc-400">Plan, generate, approve, and manually export platform-safe virtual influencer content.</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid gap-4 md:grid-cols-4">
      <div v-for="i in 4" :key="i" class="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-5">
        <div class="h-4 w-24 rounded bg-white/10" />
        <div class="mt-3 h-8 w-16 rounded bg-white/10" />
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
      {{ error }}
    </div>

    <template v-else>
      <!-- Stat cards -->
      <div class="grid gap-4 md:grid-cols-4">
        <article v-for="card in cards" :key="card.label" class="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p class="text-sm text-zinc-400">{{ card.label }}</p>
          <p :class="['mt-2 text-3xl font-semibold', card.color]">{{ card.value }}</p>
        </article>
      </div>

      <!-- Two-column detail lists -->
      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Recent campaigns -->
        <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 class="text-lg font-semibold text-zinc-200">Recent campaigns</h2>
          <ul v-if="campaigns.length" class="mt-4 space-y-3">
            <li v-for="c in campaigns.slice(0, 8)" :key="c.id" class="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
              <NuxtLink :to="`/campaigns/${c.id}`" class="text-sm text-zinc-200 hover:text-violet-400 transition-colors">{{ c.name }}</NuxtLink>
              <span class="rounded-full bg-zinc-700/50 px-2 py-0.5 text-xs text-zinc-400">{{ c.status }}</span>
            </li>
          </ul>
          <p v-else class="mt-4 text-sm text-zinc-500">No campaigns yet.</p>
        </div>

        <!-- Pending approvals -->
        <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 class="text-lg font-semibold text-zinc-200">Pending approvals</h2>
          <ul v-if="pendingApprovals.length" class="mt-4 space-y-3">
            <li v-for="a in pendingApprovals.slice(0, 8)" :key="a.id" class="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
              <div class="flex items-center gap-3">
                <div v-if="a.url" class="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-white/10">
                  <img :src="a.url" alt="" class="h-full w-full object-cover" />
                </div>
                <div v-else class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs text-zinc-500">
                  {{ a.type ?? '?' }}
                </div>
                <span class="text-sm text-zinc-300">{{ a.platform ?? 'Unknown' }}</span>
              </div>
              <NuxtLink to="/approvals" class="text-xs text-violet-400 hover:underline">Review</NuxtLink>
            </li>
          </ul>
          <p v-else class="mt-4 text-sm text-zinc-500">No pending approvals.</p>
        </div>
      </div>
    </template>
  </section>
</template>
