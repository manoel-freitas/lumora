<script setup lang="ts">
import { buildPrimaryPhotoPath } from '../../utils/persona'

interface CharacterPhoto {
  id: string
  r2Key: string
  bucket?: string | null
  url?: string | null
  isPrimary: boolean
  contentType?: string | null
  sizeBytes?: number | null
  createdAt: string
}

const props = defineProps<{
  photos: CharacterPhoto[]
  characterId: string
}>()

const emit = defineEmits<{ refresh: [] }>()

const api = useApi()
const deleting = shallowRef<string | null>(null)
const signedUrls = reactive<Record<string, string>>({})

async function loadSignedUrls() {
  await Promise.all(props.photos.map(async (photo) => {
    if (photo.url || !photo.bucket || signedUrls[photo.id]) return
    try {
      const result = await api.get<{ url: string }>('/api/storage/signed-url', { key: photo.r2Key, bucket: photo.bucket })
      signedUrls[photo.id] = result.url
    } catch (e) {
      console.error('Failed to sign photo URL', e)
    }
  }))
}

watch(() => props.photos, loadSignedUrls, { immediate: true })

function photoUrl(photo: CharacterPhoto) {
  return photo.url || signedUrls[photo.id] || ''
}

async function setPrimary(photoId: string) {
  try {
    await api.put(buildPrimaryPhotoPath(props.characterId, photoId), {})
    emit('refresh')
  } catch (e) {
    console.error('Failed to set primary', e)
  }
}

async function deletePhoto(photoId: string) {
  deleting.value = photoId
  try {
    await api.del(`/api/characters/${props.characterId}/photos/${photoId}`)
    emit('refresh')
  } catch (e) {
    console.error('Failed to delete photo', e)
  } finally {
    deleting.value = null
  }
}
</script>

<template>
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
    <div v-for="photo in photos" :key="photo.id" class="relative overflow-hidden rounded-xl border border-white/10 bg-white/5">
      <img v-if="photoUrl(photo)" :src="photoUrl(photo)" alt="Character reference" class="aspect-square w-full object-cover">
      <div v-else class="flex aspect-square w-full items-center justify-center bg-zinc-900 text-xs text-zinc-500">
        Private image
      </div>

      <button v-if="!photo.isPrimary" type="button" class="absolute inset-0 cursor-pointer" title="Set as primary" @click="setPrimary(photo.id)">
        <span class="sr-only">Set as primary</span>
      </button>

      <span v-if="photo.isPrimary" class="absolute bottom-2 left-2 rounded-full bg-violet-500/80 px-2 py-0.5 text-[10px] font-semibold text-white">
        Primary
      </span>

      <div class="absolute right-1 top-1 flex gap-1">
        <button
          v-if="!photo.isPrimary"
          class="rounded-md bg-black/60 p-1 text-xs text-white hover:bg-violet-500/80"
          title="Set as primary"
          type="button"
          @click.stop="setPrimary(photo.id)"
        >
          ★
        </button>
        <button
          class="rounded-md bg-black/60 p-1 text-xs text-white hover:bg-rose-500/80 disabled:opacity-50"
          title="Delete photo"
          type="button"
          :disabled="deleting === photo.id"
          @click.stop="deletePhoto(photo.id)"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>
