<script setup lang="ts">
import { buildCharacterPhotoMetadata } from '../../utils/persona'

const route = useRoute()
const router = useRouter()
const api = useApi()
const characters = useCharacters()
const campaigns = useCampaigns()
const galleryApi = useGallery()
const generations = useGenerations()

const id = computed(() => route.params.id as string)

const activeTab = ref('identidade')
const character = ref<any>(null)
const campaignItems = ref<any[]>([])
const galleryItems = ref<any[]>([])
const loading = ref(true)
const loadError = ref('')

const saving = ref(false)
const saveError = ref('')

const deleteConfirm = ref(false)
const deleting = ref(false)

const uploading = ref(false)
const uploadError = ref('')

const form = ref<Record<string, any>>({})

const genStatus = ref<'idle' | 'submitting' | 'polling' | 'complete' | 'error'>('idle')
const genResult = ref<any>(null)
const genError = ref('')
const genForm = reactive({
  type: 'image' as string,
  platform: 'instagram' as string,
  contentRating: 'sfw' as string,
  prompt: '',
  width: 1024 as number | undefined,
  height: 1024 as number | undefined,
})

async function loadCharacter() {
  const [charData, personaRes] = await Promise.all([
    api.get<any>(`/api/characters/${id.value}`),
    api.get<any>(`/api/characters/${id.value}/persona`).catch(() => ({ persona: null })),
  ])
  character.value = charData
  const persona = personaRes?.persona ?? null
  form.value = { ...charData, ...(persona ?? {}) }
}

async function loadTabData(tab: string) {
  if (tab === 'campanhas') {
    const res = await campaigns.list({ characterId: id.value }).catch(() => ({ items: [] })) as any
    campaignItems.value = res?.items ?? []
  } else if (tab === 'galeria') {
    const res = await galleryApi.list({ characterId: id.value }).catch(() => ({ items: [] })) as any
    galleryItems.value = res?.items ?? []
  }
}

function selectTab(tab: string) {
  activeTab.value = tab
  loadTabData(tab)
}

async function saveIdentidade() {
  saving.value = true
  saveError.value = ''
  try {
    const characterFields = {
      name: form.value.name,
      description: form.value.description,
      triggerWord: form.value.triggerWord,
      isAdult: form.value.isAdult,
    }
    const personaFields = {
      displayName: form.value.displayName,
      niche: form.value.niche,
      audience: form.value.audience,
      backstory: form.value.backstory,
      personalityTraits: form.value.personalityTraits ?? [],
      toneOfVoice: form.value.toneOfVoice,
      languages: form.value.languages ?? ['en'],
      contentPillars: form.value.contentPillars ?? [],
      visualStyle: form.value.visualStyle,
      boundaries: form.value.boundaries,
      sfwPolicy: form.value.sfwPolicy,
      nsfwPolicy: form.value.nsfwPolicy,
      disclosureNote: form.value.disclosureNote,
    }
    const [updatedChar] = await Promise.all([
      api.put<any>(`/api/characters/${id.value}`, characterFields),
      api.put<any>(`/api/characters/${id.value}/persona`, personaFields),
    ])
    character.value = updatedChar
    form.value = { ...form.value, ...updatedChar }
  } catch (e: any) {
    saveError.value = e?.data?.message || e?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}

async function onUploadPhoto(file: File) {
  uploadError.value = ''
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('entity', 'characters')
    formData.append('id', id.value)
    const upload = await api.upload<any>('/api/storage/upload', formData)
    const isPrimary = !character.value?.photos?.length
    await api.post(`/api/characters/${id.value}/photos`, buildCharacterPhotoMetadata(upload, isPrimary))
    await reloadCharacter()
  } catch (e: any) {
    uploadError.value = e?.data?.error || e?.message || 'Upload failed'
  } finally {
    uploading.value = false
  }
}

async function reloadCharacter() {
  const charData = await characters.get(id.value) as any
  character.value = charData
  form.value = { ...form.value, ...charData }
}

async function onDelete() {
  deleting.value = true
  try {
    await characters.remove(id.value)
    await router.push('/characters')
  } catch (e: any) {
    saveError.value = e?.data?.error || e?.message || 'Delete failed'
    deleting.value = false
  }
}

async function gerar() {
  if (!genForm.prompt.trim()) return
  genStatus.value = 'submitting'
  genError.value = ''
  genResult.value = null
  try {
    const body: Record<string, any> = {
      type: genForm.type,
      platform: genForm.platform,
      contentRating: genForm.contentRating,
      prompt: genForm.prompt.trim(),
      characterId: id.value,
    }
    if (genForm.width) body.width = genForm.width
    if (genForm.height) body.height = genForm.height

    const gen = await generations.create(body) as any
    genStatus.value = 'polling'
    genResult.value = await generations.pollUntilDone(gen.id, (update) => {
      genResult.value = update
    })
    genStatus.value = 'complete'
  } catch (e: any) {
    genError.value = e.message ?? 'Generation failed'
    genStatus.value = 'error'
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { month: 'long', day: 'numeric', year: 'numeric' })
}

onMounted(async () => {
  try {
    await loadCharacter()
  } catch (e: any) {
    loadError.value = e?.data?.error || e?.message || 'Failed to load character'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="space-y-6">
    <nav class="flex items-center gap-2 text-sm text-zinc-400">
      <NuxtLink to="/characters" class="hover:text-zinc-200">Characters</NuxtLink>
      <span>/</span>
      <span class="text-zinc-200">{{ character?.name ?? '…' }}</span>
    </nav>

    <div v-if="loading" class="py-20 text-center text-zinc-500">Loading…</div>

    <div v-else-if="loadError" class="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center text-rose-300">
      {{ loadError }}
    </div>

    <template v-else-if="character">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold">{{ character.name }}</h1>
          <p class="mt-1 text-sm text-zinc-500">Created {{ formatDate(character.createdAt) }}</p>
        </div>
        <div class="flex gap-2">
          <button
            v-if="!deleteConfirm"
            class="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300 transition-colors hover:bg-rose-500/20"
            @click="deleteConfirm = true"
          >
            Delete
          </button>
          <template v-else>
            <button
              class="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              :disabled="deleting"
              @click="onDelete"
            >
              {{ deleting ? 'Deleting…' : 'Confirm' }}
            </button>
            <button
              class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300"
              @click="deleteConfirm = false"
            >
              Cancel
            </button>
          </template>
        </div>
      </div>

      <div class="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
        <button
          v-for="tab in [
            { key: 'identidade', label: 'Identidade' },
            { key: 'campanhas', label: 'Campanhas' },
            { key: 'galeria', label: 'Galeria' },
            { key: 'gerar', label: 'Gerar' },
          ]"
          :key="tab.key"
          :class="[
            'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            activeTab === tab.key
              ? 'bg-violet-500 text-white'
              : 'text-zinc-400 hover:text-zinc-200',
          ]"
          @click="selectTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div v-if="activeTab === 'identidade'" class="space-y-6">
        <div v-if="saveError" class="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {{ saveError }}
        </div>

        <div class="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 class="text-lg font-semibold text-zinc-100">Informações visuais</h2>
          <div class="grid gap-4 lg:grid-cols-2">
            <label class="space-y-2">
              <span class="text-sm font-medium text-zinc-300">Name</span>
              <input
                v-model="form.name"
                class="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-400"
                placeholder="Character name"
              >
            </label>

            <label class="space-y-2">
              <span class="text-sm font-medium text-zinc-300">Trigger word</span>
              <input
                v-model="form.triggerWord"
                class="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-400"
                placeholder="Optional trigger word"
              >
            </label>

            <label class="space-y-2 lg:col-span-2">
              <span class="text-sm font-medium text-zinc-300">Description</span>
              <textarea
                v-model="form.description"
                rows="3"
                class="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-400"
                placeholder="Optional description"
              />
            </label>

            <div class="flex items-center gap-2">
              <input
                id="char-adult"
                v-model="form.isAdult"
                type="checkbox"
                class="h-4 w-4 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-400"
              >
              <label for="char-adult" class="text-sm text-zinc-300">Adult content</label>
            </div>
          </div>
        </div>

        <InfluencerPersonaForm
          :initial-values="form"
          :submitting="saving"
          submit-label="Salvar identidade"
          @submit="(personaValues: Record<string, unknown>) => { Object.assign(form, personaValues); saveIdentidade() }"
        />

        <section class="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-xl font-semibold">Fotos de referência</h2>
              <p class="mt-1 text-sm text-zinc-500">Uploads privados no R2 para gerações consistentes.</p>
            </div>
            <span v-if="uploading" class="text-sm text-violet-300">Enviando…</span>
          </div>

          <FileUpload label="Upload reference photo" :disabled="uploading" @select="onUploadPhoto" />
          <div v-if="uploadError" class="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {{ uploadError }}
          </div>

          <CharacterPhotoGrid
            v-if="character.photos?.length"
            :photos="character.photos"
            :character-id="id"
            @refresh="reloadCharacter()"
          />
          <div v-else class="rounded-2xl border border-white/10 bg-zinc-950/60 p-6 text-center text-sm text-zinc-500">
            Nenhuma foto ainda.
          </div>
        </section>
      </div>

      <div v-else-if="activeTab === 'campanhas'" class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">Campanhas</h2>
          <NuxtLink
            :to="`/campaigns/new?characterId=${id}`"
            class="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-400"
          >
            Nova Campanha
          </NuxtLink>
        </div>

        <div v-if="!campaignItems.length" class="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-sm text-zinc-500">
          Nenhuma campanha ainda. Crie a primeira.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="campaign in campaignItems"
            :key="campaign.id"
            class="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div>
              <p class="font-medium text-zinc-100">{{ campaign.name }}</p>
              <p v-if="campaign.platform" class="mt-0.5 text-sm text-zinc-500">{{ campaign.platform }}</p>
            </div>
            <NuxtLink
              :to="`/campaigns/${campaign.id}`"
              class="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10"
            >
              Ver
            </NuxtLink>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'galeria'" class="space-y-4">
        <h2 class="text-xl font-semibold">Galeria</h2>

        <div v-if="!galleryItems.length" class="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-sm text-zinc-500">
          Nenhum conteúdo ainda.
        </div>

        <GalleryGrid v-else :items="galleryItems" />
      </div>

      <div v-else-if="activeTab === 'gerar'" class="space-y-6">
        <h2 class="text-xl font-semibold">Gerar conteúdo</h2>

        <form class="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6" @submit.prevent="gerar">
          <div class="grid gap-4 lg:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm text-zinc-400">Tipo</label>
              <select
                v-model="genForm.type"
                class="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-violet-400"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>

            <div>
              <label class="mb-1 block text-sm text-zinc-400">Plataforma</label>
              <select
                v-model="genForm.platform"
                class="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-violet-400"
              >
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube_shorts">YouTube Shorts</option>
                <option value="x">X</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label class="mb-1 block text-sm text-zinc-400">Classificação</label>
              <select
                v-model="genForm.contentRating"
                class="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-violet-400"
              >
                <option value="sfw">SFW</option>
                <option value="suggestive">Suggestive</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="mb-1 block text-sm text-zinc-400">Width</label>
                <input
                  v-model.number="genForm.width"
                  type="number"
                  class="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-violet-400"
                  placeholder="1024"
                >
              </div>
              <div>
                <label class="mb-1 block text-sm text-zinc-400">Height</label>
                <input
                  v-model.number="genForm.height"
                  type="number"
                  class="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-violet-400"
                  placeholder="1024"
                >
              </div>
            </div>
          </div>

          <div>
            <label class="mb-1 block text-sm text-zinc-400">Prompt</label>
            <textarea
              v-model="genForm.prompt"
              rows="4"
              class="w-full rounded-xl border border-white/10 bg-zinc-950 p-3 text-sm text-zinc-200 outline-none focus:border-violet-400"
              placeholder="Descreva o conteúdo que quer gerar…"
            />
          </div>

          <button
            type="submit"
            :disabled="genStatus === 'submitting' || genStatus === 'polling' || !genForm.prompt.trim()"
            class="rounded-full bg-violet-500 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span v-if="genStatus === 'submitting'">Enviando…</span>
            <span v-else-if="genStatus === 'polling'">Processando…</span>
            <span v-else>Gerar</span>
          </button>
        </form>

        <div v-if="genStatus !== 'idle'" class="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div class="flex items-center gap-3">
            <div
              v-if="genStatus === 'submitting' || genStatus === 'polling'"
              class="h-4 w-4 animate-spin rounded-full border-2 border-violet-400 border-t-transparent"
            />
            <span class="text-sm text-zinc-300">
              <template v-if="genStatus === 'submitting'">Enviando solicitação…</template>
              <template v-else-if="genStatus === 'polling'">Aguardando resultado…</template>
              <template v-else-if="genStatus === 'complete'">Concluido</template>
              <template v-else-if="genStatus === 'error'">Erro na geração</template>
            </span>
          </div>

          <p v-if="genError" class="text-sm text-red-400">{{ genError }}</p>

          <div v-if="genResult" class="space-y-2">
            <GenerationStatusBadge :status="genResult.status ?? 'unknown'" />
            <img
              v-if="genResult.url"
              :src="genResult.url"
              alt="Generated content"
              class="mt-2 max-h-96 rounded-xl object-contain"
            >
          </div>
        </div>
      </div>
    </template>
  </section>
</template>
