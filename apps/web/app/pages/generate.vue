<script setup lang="ts">
const api = useApi()
const generations = useGenerations()
const characters = useCharacters()

const form = reactive({
  type: 'image' as string,
  platform: 'instagram' as string,
  contentRating: 'sfw' as string,
  prompt: '',
  width: undefined as number | undefined,
  height: undefined as number | undefined,
})

const characterList = ref<any[]>([])
const selectedCharacterId = ref('')
const selectedPersona = ref<any>(null)

const status = ref<'idle' | 'submitting' | 'polling' | 'complete' | 'error'>('idle')
const generationId = ref('')
const result = ref<any>(null)
const errorMsg = ref('')

const canSubmit = computed(
  () => !!selectedCharacterId.value && !!form.prompt.trim() && status.value !== 'submitting' && status.value !== 'polling',
)

onMounted(async () => {
  const res = await characters.list() as any
  characterList.value = res?.items ?? []
})

async function onCharacterSelect(id: string) {
  selectedCharacterId.value = id
  if (!id) {
    selectedPersona.value = null
    return
  }
  const res = await api.get<{ persona: any }>(`/api/characters/${id}/persona`)
  selectedPersona.value = res?.persona ?? null
}

async function submit() {
  if (!canSubmit.value) return

  status.value = 'submitting'
  errorMsg.value = ''
  result.value = null

  try {
    const body: Record<string, any> = {
      type: form.type,
      platform: form.platform,
      contentRating: form.contentRating,
      prompt: form.prompt.trim(),
      characterId: selectedCharacterId.value,
    }
    if (form.width) body.width = form.width
    if (form.height) body.height = form.height

    const gen = await generations.create(body) as any
    generationId.value = gen.id

    status.value = 'polling'
    result.value = await generations.pollUntilDone(gen.id, (update) => {
      result.value = update
    })
    status.value = 'complete'
  } catch (e: any) {
    errorMsg.value = e.message ?? 'Generation failed'
    status.value = 'error'
  }
}
</script>

<template>
  <section class="space-y-6">
    <h1 class="text-3xl font-bold">Generate</h1>

    <form class="space-y-4" @submit.prevent="submit">
      <!-- Character (required) -->
      <div>
        <label class="mb-1 block text-sm text-zinc-400">Character <span class="text-red-400">*</span></label>
        <select
          :value="selectedCharacterId"
          class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-violet-500"
          @change="onCharacterSelect(($event.target as HTMLSelectElement).value)"
        >
          <option disabled value="">Select a character…</option>
          <option v-for="c in characterList" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>

        <!-- Persona hints -->
        <div v-if="selectedPersona" class="mt-2 rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
          <p v-if="selectedPersona.niche" class="text-zinc-400">Nicho: <span class="text-zinc-200">{{ selectedPersona.niche }}</span></p>
          <p v-if="selectedPersona.toneOfVoice" class="text-zinc-400">Tom: <span class="text-zinc-200">{{ selectedPersona.toneOfVoice }}</span></p>
          <p v-if="selectedPersona.contentPillars?.length" class="text-zinc-400">Pilares: <span class="text-zinc-200">{{ selectedPersona.contentPillars.join(', ') }}</span></p>
        </div>
      </div>

      <!-- Type -->
      <div>
        <label class="mb-1 block text-sm text-zinc-400">Type</label>
        <select
          v-model="form.type"
          class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-violet-500"
        >
          <option value="image">Image</option>
          <option value="video">Video</option>
        </select>
      </div>

      <!-- Platform -->
      <div>
        <label class="mb-1 block text-sm text-zinc-400">Platform</label>
        <select
          v-model="form.platform"
          class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-violet-500"
        >
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
          <option value="youtube_shorts">YouTube Shorts</option>
          <option value="x">X</option>
          <option value="other">Other</option>
        </select>
      </div>

      <!-- Content Rating -->
      <div>
        <label class="mb-1 block text-sm text-zinc-400">Content rating</label>
        <select
          v-model="form.contentRating"
          class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-violet-500"
        >
          <option value="sfw">SFW</option>
          <option value="suggestive">Suggestive</option>
        </select>
      </div>

      <!-- Prompt -->
      <div>
        <label class="mb-1 block text-sm text-zinc-400">Prompt</label>
        <textarea
          v-model="form.prompt"
          rows="4"
          class="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-zinc-200 outline-none focus:border-violet-500"
          placeholder="Describe the content you want to generate..."
        />
      </div>

      <!-- Width / Height -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="mb-1 block text-sm text-zinc-400">Width <span class="text-zinc-600">(optional)</span></label>
          <input
            v-model.number="form.width"
            type="number"
            class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-violet-500"
            placeholder="e.g. 1024"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm text-zinc-400">Height <span class="text-zinc-600">(optional)</span></label>
          <input
            v-model.number="form.height"
            type="number"
            class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-violet-500"
            placeholder="e.g. 1024"
          />
        </div>
      </div>

      <!-- Submit -->
      <button
        type="submit"
        :disabled="!canSubmit"
        class="rounded-full bg-violet-500 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-violet-400 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span v-if="status === 'submitting'">Submitting...</span>
        <span v-else-if="status === 'polling'">Processing...</span>
        <span v-else>Generate</span>
      </button>
    </form>

    <!-- Status indicator -->
    <div v-if="status !== 'idle'" class="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
      <div class="flex items-center gap-3">
        <div v-if="status === 'submitting' || status === 'polling'" class="h-4 w-4 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
        <span class="text-sm text-zinc-300">
          <template v-if="status === 'submitting'">Submitting generation request...</template>
          <template v-else-if="status === 'polling'">Polling status for generation {{ generationId }}...</template>
          <template v-else-if="status === 'complete'">✓ Generation complete</template>
          <template v-else-if="status === 'error'">✕ Error</template>
        </span>
      </div>

      <p v-if="errorMsg" class="text-sm text-red-400">{{ errorMsg }}</p>

      <!-- Result -->
      <div v-if="result" class="space-y-2">
        <p class="text-xs text-zinc-500">ID: {{ generationId }}</p>
        <GenerationStatusBadge :status="result.status ?? 'unknown'" />
        <img
          v-if="result.url"
          :src="result.url"
          alt="Generated content"
          class="mt-2 max-h-96 rounded-xl object-contain"
        />
      </div>
    </div>
  </section>
</template>
