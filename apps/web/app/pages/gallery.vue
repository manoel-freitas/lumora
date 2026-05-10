<script setup lang="ts">
const gallery = useGallery()

const items = ref<any[]>([])
const total = ref(0)
const loading = ref(true)
const error = ref('')

const page = ref(1)
const limit = 20
const typeFilter = ref<string>('')
const platformFilter = ref<string>('')

async function fetchGallery() {
  loading.value = true
  error.value = ''
  try {
    const params: Record<string, unknown> = { page: page.value, limit }
    if (typeFilter.value) params.type = typeFilter.value
    if (platformFilter.value) params.platform = platformFilter.value
    const res = await gallery.list(params) as { items: any[]; total: number }
    items.value = res.items ?? []
    total.value = res.total ?? 0
  } catch (e: any) {
    error.value = e.message ?? 'Failed to load gallery'
  } finally {
    loading.value = false
  }
}

function setPage(p: number) {
  page.value = p
  fetchGallery()
}

watch([typeFilter, platformFilter], () => {
  page.value = 1
  fetchGallery()
})

onMounted(fetchGallery)

const totalPages = computed(() => Math.ceil(total.value / limit))

const selectedItem = ref<any>(null)
async function selectItem(id: string) {
  try {
    selectedItem.value = await gallery.get(id) as any
  } catch { selectedItem.value = null }
}
</script>

<template>
  <section class="space-y-6">
    <h1 class="text-3xl font-bold">Gallery</h1>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3">
      <select
        v-model="typeFilter"
        class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-violet-500"
      >
        <option value="">All types</option>
        <option value="image">Image</option>
        <option value="video">Video</option>
      </select>
      <select
        v-model="platformFilter"
        class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-violet-500"
      >
        <option value="">All platforms</option>
        <option value="instagram">Instagram</option>
        <option value="tiktok">TikTok</option>
        <option value="youtube">YouTube</option>
        <option value="twitter">Twitter/X</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <div v-for="i in 8" :key="i" class="aspect-square animate-pulse rounded-xl bg-white/5" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
      {{ error }}
    </div>

    <!-- Empty -->
    <div v-else-if="!items.length" class="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-zinc-500">
      No items found.
    </div>

    <!-- Grid -->
    <template v-else>
      <GalleryGrid :items="items" @select="selectItem" />

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-4 pt-4">
        <button
          :disabled="page <= 1"
          class="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          @click="setPage(page - 1)"
        >
          ← Prev
        </button>
        <span class="text-sm text-zinc-400">Page {{ page }} of {{ totalPages }}</span>
        <button
          :disabled="page >= totalPages"
          class="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          @click="setPage(page + 1)"
        >
          Next →
        </button>
      </div>
    </template>

    <!-- Detail modal/panel -->
    <div
      v-if="selectedItem"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      @click.self="selectedItem = null"
    >
      <div class="relative max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border border-white/10 bg-zinc-900 p-4">
        <button class="absolute right-3 top-3 text-zinc-400 hover:text-white" @click="selectedItem = null">✕</button>
        <img
          v-if="selectedItem.url || selectedItem.signedUrl"
          :src="selectedItem.signedUrl || selectedItem.url"
          alt=""
          class="mx-auto max-h-[60vh] rounded-xl object-contain"
        />
        <div class="mt-4 space-y-2 text-sm text-zinc-300">
          <p v-if="selectedItem.platform"><span class="text-zinc-500">Platform:</span> {{ selectedItem.platform }}</p>
          <p v-if="selectedItem.type"><span class="text-zinc-500">Type:</span> {{ selectedItem.type }}</p>
          <p v-if="selectedItem.caption"><span class="text-zinc-500">Caption:</span> {{ selectedItem.caption }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
