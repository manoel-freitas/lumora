<script setup lang="ts">
definePageMeta({ layout: 'default' })

const router = useRouter()
const api = useApi()

const submitting = ref(false)
const errorMessage = ref('')

async function onCreate(values: {
  name: string
  description: string
  triggerWord: string
  isAdult: boolean
}) {
  submitting.value = true
  errorMessage.value = ''
  try {
    const body: Record<string, any> = { name: values.name }
    if (values.description) body.description = values.description
    if (values.triggerWord) body.triggerWord = values.triggerWord
    if (values.isAdult) body.isAdult = values.isAdult

    const char = await api.post<{ id: string }>('/api/characters', body)
    await router.push(`/characters/${char.id}`)
  } catch (e: any) {
    errorMessage.value = e?.data?.message || e?.message || 'Failed to create character'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="space-y-6">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-sm text-zinc-400">
      <NuxtLink to="/characters" class="hover:text-zinc-200">Characters</NuxtLink>
      <span>/</span>
      <span class="text-zinc-200">New</span>
    </nav>

    <h1 class="text-3xl font-bold">Create Character</h1>

    <div v-if="errorMessage" class="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
      {{ errorMessage }}
    </div>

    <div class="max-w-lg">
      <CharacterForm
        submit-label="Create"
        :submitting="submitting"
        @submit="onCreate"
      />
    </div>
  </section>
</template>
