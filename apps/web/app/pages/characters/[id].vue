<script setup lang="ts">
import { buildCharacterPhotoMetadata } from '../../utils/persona'

const route = useRoute()
const router = useRouter()
const api = useApi()
const characterId = route.params.id as string

const { data: character, pending, error, refresh } = await useApiFetch<any>(`/api/characters/${characterId}`)
const { data: personaResult, refresh: refreshPersona } = await useApiFetch<any>(`/api/characters/${characterId}/persona`)

const editing = shallowRef(false)
const submitting = shallowRef(false)
const editError = shallowRef('')
const deleteConfirm = shallowRef(false)
const deleting = shallowRef(false)
const personaSubmitting = shallowRef(false)
const personaError = shallowRef('')
const uploadError = shallowRef('')
const uploading = shallowRef(false)

const persona = computed(() => personaResult.value?.persona || null)

async function onUpdate(values: {
  name: string
  description: string
  triggerWord: string
  isAdult: boolean
}) {
  submitting.value = true
  editError.value = ''
  try {
    await api.put(`/api/characters/${characterId}`, {
      name: values.name,
      description: values.description,
      triggerWord: values.triggerWord,
      isAdult: values.isAdult,
    })
    editing.value = false
    await refresh()
  } catch (e: any) {
    editError.value = e?.data?.message || e?.message || 'Failed to update character'
  } finally {
    submitting.value = false
  }
}

async function onSavePersona(values: Record<string, unknown>) {
  personaSubmitting.value = true
  personaError.value = ''
  try {
    await api.put(`/api/characters/${characterId}/persona`, values)
    await refreshPersona()
  } catch (e: any) {
    personaError.value = e?.data?.error || e?.data?.message || e?.message || 'Failed to save persona'
  } finally {
    personaSubmitting.value = false
  }
}

async function onUploadPhoto(file: File) {
  uploadError.value = ''
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('entity', 'characters')
    formData.append('id', characterId)

    const upload = await api.upload<any>('/api/storage/upload', formData)
    const isPrimary = !character.value?.photos?.length

    await api.post(`/api/characters/${characterId}/photos`, buildCharacterPhotoMetadata(upload, isPrimary))
    await refresh()
  } catch (e: any) {
    uploadError.value = e?.data?.error || e?.message || 'Upload failed'
  } finally {
    uploading.value = false
  }
}

async function onDelete() {
  deleting.value = true
  try {
    await api.del(`/api/characters/${characterId}`)
    await router.push('/characters')
  } catch (e: any) {
    editError.value = e?.data?.error || e?.message || 'Delete failed'
    deleting.value = false
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>

<template>
  <section class="space-y-6">
    <nav class="flex items-center gap-2 text-sm text-zinc-400">
      <NuxtLink to="/characters" class="hover:text-zinc-200">Characters</NuxtLink>
      <span>/</span>
      <span class="text-zinc-200">{{ character?.name ?? '…' }}</span>
    </nav>

    <div v-if="pending" class="py-20 text-center text-zinc-500">Loading…</div>

    <div v-else-if="error" class="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center text-rose-300">
      Failed to load character.
    </div>

    <template v-else-if="character">
      <template v-if="!editing">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold">{{ character.name }}</h1>
            <p class="mt-1 text-sm text-zinc-500">Created {{ formatDate(character.createdAt) }}</p>
          </div>
          <div class="flex gap-2">
            <button class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/10" @click="editing = true">
              Edit
            </button>
            <button v-if="!deleteConfirm" class="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300 transition-colors hover:bg-rose-500/20" @click="deleteConfirm = true">
              Delete
            </button>
            <template v-else>
              <button class="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" :disabled="deleting" @click="onDelete">
                {{ deleting ? 'Deleting…' : 'Confirm' }}
              </button>
              <button class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300" @click="deleteConfirm = false">
                Cancel
              </button>
            </template>
          </div>
        </div>

        <div class="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
          <p v-if="character.description" class="text-sm text-zinc-300">{{ character.description }}</p>
          <p v-else class="text-sm italic text-zinc-500">No description</p>

          <div class="flex flex-wrap gap-2">
            <span v-if="character.triggerWord" class="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-medium text-violet-300">
              {{ character.triggerWord }}
            </span>
            <span v-if="character.isAdult" class="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-medium text-rose-300">
              Clearly adult-coded
            </span>
          </div>
        </div>

        <section class="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-xl font-semibold">Reference photos</h2>
              <p class="mt-1 text-sm text-zinc-500">Private R2 uploads used for character-consistent generations.</p>
            </div>
            <span v-if="uploading" class="text-sm text-violet-300">Uploading…</span>
          </div>

          <FileUpload label="Upload reference photo" :disabled="uploading" @select="onUploadPhoto" />
          <div v-if="uploadError" class="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{{ uploadError }}</div>

          <CharacterPhotoGrid v-if="character.photos?.length" :photos="character.photos" :character-id="characterId" @refresh="refresh()" />
          <div v-else class="rounded-2xl border border-white/10 bg-zinc-950/60 p-6 text-center text-sm text-zinc-500">
            No photos yet.
          </div>
        </section>

        <section class="space-y-4">
          <div>
            <p class="text-sm uppercase tracking-[0.3em] text-violet-300">Influencer persona</p>
            <h2 class="mt-2 text-2xl font-semibold">Social identity and boundaries</h2>
            <p class="mt-1 text-sm text-zinc-500">Define niche, voice, content pillars, visual style, and SFW safety rules.</p>
          </div>
          <div v-if="personaError" class="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{{ personaError }}</div>
          <InfluencerPersonaForm :initial-values="persona" :submitting="personaSubmitting" @submit="onSavePersona" />
        </section>
      </template>

      <template v-else>
        <h1 class="text-3xl font-bold">Edit Character</h1>

        <div v-if="editError" class="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {{ editError }}
        </div>

        <div class="max-w-lg">
          <CharacterForm
            :initial-values="{
              name: character.name,
              description: character.description ?? '',
              triggerWord: character.triggerWord ?? '',
              isAdult: character.isAdult,
            }"
            submit-label="Save"
            :submitting="submitting"
            @submit="onUpdate"
          />
          <button class="mt-3 text-sm text-zinc-400 hover:text-zinc-200" @click="editing = false; editError = ''">
            Cancel
          </button>
        </div>
      </template>
    </template>
  </section>
</template>
