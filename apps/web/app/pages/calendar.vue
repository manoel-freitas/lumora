<script setup lang="ts">
const api = useApi()

interface ContentPlan {
  id: string
  contentAssetId: string
  platform?: string
  caption?: string
  hashtags?: string[]
  platformNotes?: string
  status: string
  plannedFor?: string
  assetUrl?: string
}

const plans = shallowRef<ContentPlan[]>([])
const loading = shallowRef(true)
const error = shallowRef('')
const actionLoading = reactive<Record<string, boolean>>({})
const actionMessage = reactive<Record<string, string>>({})

async function loadPlans() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get<{ items: ContentPlan[] }>('/api/content-plans')
    plans.value = res.items ?? []
  } catch (e: any) {
    error.value = e.message ?? 'Failed to load calendar'
  } finally {
    loading.value = false
  }
}

onMounted(loadPlans)

const grouped = computed(() => {
  const groups = new Map<string, { label: string; sort: number; plans: ContentPlan[] }>()
  for (const plan of plans.value) {
    const sort = plan.plannedFor ? new Date(plan.plannedFor).getTime() : Number.POSITIVE_INFINITY
    const label = plan.plannedFor
      ? new Date(plan.plannedFor).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      : 'Unscheduled'
    const group = groups.get(label) || { label, sort, plans: [] }
    group.plans.push(plan)
    groups.set(label, group)
  }
  return [...groups.values()].sort((a, b) => a.sort - b.sort)
})

const statusColor: Record<string, string> = {
  draft: 'bg-zinc-500/20 text-zinc-400',
  approved: 'bg-violet-500/20 text-violet-400',
  exported: 'bg-emerald-500/20 text-emerald-400',
  manually_posted: 'bg-blue-500/20 text-blue-400',
  cancelled: 'bg-red-500/20 text-red-400',
}

async function createExport(plan: ContentPlan) {
  actionLoading[plan.id] = true
  actionMessage[plan.id] = ''
  try {
    const pkg = await api.post<any>('/api/exports', {
      contentAssetId: plan.contentAssetId,
      contentPlanId: plan.id,
      platform: plan.platform,
      caption: plan.caption,
      hashtags: plan.hashtags || [],
      platformNotes: plan.platformNotes,
    })
    await api.get(`/api/exports/${pkg.id}/download`)
    await api.post(`/api/content-plans/${plan.id}/mark-exported`, {})
    actionMessage[plan.id] = `Export package ready: ${pkg.id}`
    await loadPlans()
  } catch (e: any) {
    actionMessage[plan.id] = e?.data?.error || e?.message || 'Export failed'
  } finally {
    actionLoading[plan.id] = false
  }
}

async function markPosted(plan: ContentPlan) {
  actionLoading[plan.id] = true
  actionMessage[plan.id] = ''
  try {
    await api.post(`/api/content-plans/${plan.id}/mark-manually-posted`, {})
    actionMessage[plan.id] = 'Marked as manually posted.'
    await loadPlans()
  } catch (e: any) {
    actionMessage[plan.id] = e?.data?.error || e?.message || 'Could not mark posted'
  } finally {
    actionLoading[plan.id] = false
  }
}
</script>

<template>
  <section class="space-y-6">
    <div>
      <p class="text-sm uppercase tracking-[0.3em] text-violet-300">Manual publishing workflow</p>
      <h1 class="mt-2 text-3xl font-bold">Content Calendar</h1>
      <p class="mt-2 text-zinc-400">Plan approved assets, create manual export packages, and track manual posting.</p>
    </div>

    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="h-20 animate-pulse rounded-2xl bg-white/5" />
    </div>

    <div v-else-if="error" class="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
      {{ error }}
    </div>

    <div v-else-if="!plans.length" class="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-zinc-500">
      No content plans yet.
    </div>

    <template v-else>
      <div v-for="group in grouped" :key="group.label" class="space-y-2">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-violet-400">{{ group.label }}</h2>
        <ul class="space-y-2">
          <li v-for="plan in group.plans" :key="plan.id" class="space-y-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div class="flex flex-col gap-4 md:flex-row md:items-center">
              <span v-if="plan.platform" class="flex-shrink-0 rounded-full bg-violet-500/30 px-2 py-0.5 text-xs font-medium text-violet-300">
                {{ plan.platform }}
              </span>
              <span v-else class="flex-shrink-0 rounded-full bg-zinc-700/50 px-2 py-0.5 text-xs text-zinc-500">
                no platform
              </span>

              <p class="flex-1 truncate text-sm text-zinc-300">
                {{ plan.caption ?? 'No caption' }}
              </p>

              <span :class="['flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', statusColor[plan.status] ?? 'bg-zinc-500/20 text-zinc-400']">
                {{ plan.status }}
              </span>

              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  :disabled="actionLoading[plan.id] || !plan.contentAssetId || plan.status === 'manually_posted'"
                  class="rounded-full bg-violet-400 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
                  @click="createExport(plan)"
                >
                  Export package
                </button>
                <button
                  v-if="plan.status === 'exported'"
                  type="button"
                  :disabled="actionLoading[plan.id]"
                  class="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/15 disabled:opacity-50"
                  @click="markPosted(plan)"
                >
                  Mark posted
                </button>
              </div>
            </div>
            <p v-if="actionMessage[plan.id]" class="text-xs" :class="(actionMessage[plan.id] || '').includes('failed') || (actionMessage[plan.id] || '').includes('required') ? 'text-red-300' : 'text-emerald-300'">
              {{ actionMessage[plan.id] }}
            </p>
          </li>
        </ul>
      </div>
    </template>
  </section>
</template>
