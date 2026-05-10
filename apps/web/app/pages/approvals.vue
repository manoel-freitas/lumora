<script setup lang="ts">
const api = useApi()

interface ApprovalAsset {
  id: string
  url?: string
  platform?: string
  type?: string
  assetType?: string
  contentRating?: string
  status: string
  caption?: string
  notes?: string
  safetyRating?: string
}

const items = ref<ApprovalAsset[]>([])
const loading = ref(true)
const error = ref('')
const actionLoading = ref<Record<string, boolean>>({})

async function fetchApprovals() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get<{ items: ApprovalAsset[] }>('/api/approvals')
    items.value = res.items ?? []
  } catch (e: any) {
    error.value = e.message ?? 'Failed to load approvals'
  } finally {
    loading.value = false
  }
}

async function approve(id: string) {
  actionLoading.value[id] = true
  try {
    await api.post(`/api/assets/${id}/approve`, {})
    const item = items.value.find(i => i.id === id)
    if (item) item.status = 'approved'
  } catch (e: any) {
    error.value = e.message ?? 'Approve failed'
  } finally {
    actionLoading.value[id] = false
  }
}

async function reject(id: string) {
  actionLoading.value[id] = true
  try {
    await api.post(`/api/assets/${id}/reject`, {})
    const item = items.value.find(i => i.id === id)
    if (item) item.status = 'rejected'
  } catch (e: any) {
    error.value = e.message ?? 'Reject failed'
  } finally {
    actionLoading.value[id] = false
  }
}

onMounted(fetchApprovals)

const statusColor: Record<string, string> = {
  generated: 'bg-amber-500/20 text-amber-400',
  reviewed: 'bg-sky-500/20 text-sky-400',
  approved: 'bg-emerald-500/20 text-emerald-400',
  rejected: 'bg-red-500/20 text-red-400',
}
</script>

<template>
  <section class="space-y-6">
    <h1 class="text-3xl font-bold">Approvals</h1>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-24 animate-pulse rounded-2xl bg-white/5" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
      {{ error }}
    </div>

    <!-- Empty -->
    <div v-else-if="!items.length" class="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-zinc-500">
      No assets pending approval.
    </div>

    <!-- List -->
    <ul v-else class="space-y-3">
      <li
        v-for="item in items"
        :key="item.id"
        class="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center"
      >
        <!-- Media preview -->
        <div class="flex-shrink-0">
          <div v-if="item.url" class="h-20 w-20 overflow-hidden rounded-xl bg-white/10">
            <img :src="item.url" alt="" class="h-full w-full object-cover" />
          </div>
          <div v-else class="flex h-20 w-20 items-center justify-center rounded-xl bg-white/10 text-xs text-zinc-500">
            {{ item.assetType || item.type || 'No preview' }}
          </div>
        </div>

        <!-- Info -->
        <div class="flex-1 space-y-1">
          <div class="flex items-center gap-2">
            <span v-if="item.platform" class="rounded-full bg-violet-500/30 px-2 py-0.5 text-xs font-medium text-violet-300">
              {{ item.platform }}
            </span>
            <span :class="['rounded-full px-2 py-0.5 text-xs font-medium', statusColor[item.status] ?? 'bg-zinc-500/20 text-zinc-400']">
              {{ item.status }}
            </span>
          </div>
          <p v-if="item.caption" class="line-clamp-2 text-sm text-zinc-400">{{ item.caption }}</p>
          <p v-else-if="item.notes" class="line-clamp-2 text-sm text-zinc-400">{{ item.notes }}</p>
          <p class="text-xs text-zinc-500">{{ item.assetType || item.type || 'asset' }} · Safety: {{ item.safetyRating || 'pending' }} · ID: {{ item.id }}</p>
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <button
            :disabled="actionLoading[item.id] || item.status === 'approved'"
            class="rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
            @click="approve(item.id)"
          >
            {{ item.status === 'approved' ? 'Approved' : 'Approve' }}
          </button>
          <button
            :disabled="actionLoading[item.id] || item.status === 'rejected'"
            class="rounded-full bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
            @click="reject(item.id)"
          >
            {{ item.status === 'rejected' ? 'Rejected' : 'Reject' }}
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>
