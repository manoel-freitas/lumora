<script setup lang="ts">
import { formatCharacterCreatedAt, type CharacterListItem } from '~/utils/character'

const charactersApi = useCharacters()
const campaignsApi = useCampaigns()
const generationsApi = useGenerations()
const api = useApi()

const characters = ref<CharacterListItem[]>([])
const campaigns = ref<any[]>([])
const generations = ref<any[]>([])
const usage = ref<any>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  const [charRes, campRes, genRes, usageRes] = await Promise.allSettled([
    charactersApi.list() as Promise<{ items: CharacterListItem[] }>,
    campaignsApi.list() as Promise<{ items: any[] }>,
    generationsApi.list() as Promise<{ items: any[] }>,
    api.get<any>('/api/usage/current-month'),
  ])
  if (charRes.status === 'fulfilled') characters.value = charRes.value?.items ?? []
  else error.value = (charRes.reason as Error)?.message ?? 'Failed to load'
  if (campRes.status === 'fulfilled') campaigns.value = campRes.value?.items ?? []
  if (genRes.status === 'fulfilled') generations.value = genRes.value?.items ?? []
  if (usageRes.status === 'fulfilled') usage.value = usageRes.value
  loading.value = false
})

const activeCampaignsByCharacter = computed(() => {
  const map = new Map<string, number>()
  for (const c of campaigns.value) {
    if (c.status === 'active') map.set(c.characterId, (map.get(c.characterId) ?? 0) + 1)
  }
  return map
})

const lastGenerationByCharacter = computed(() => {
  const map = new Map<string, string>()
  for (const g of generations.value) {
    if (!g.characterId) continue
    const ex = map.get(g.characterId)
    if (!ex || g.createdAt > ex) map.set(g.characterId, g.createdAt)
  }
  return map
})
</script>

<template>
  <section class="space-y-8">
    <div>
      <p class="text-sm uppercase tracking-widest text-violet-300">AI influencer studio</p>
      <h1 class="mt-2 text-3xl font-bold">Personagens</h1>
      <p class="mt-1 text-zinc-400">Selecione um personagem para gerenciar campanhas, gerar conteúdo e revisar aprovações.</p>
    </div>

    <div v-if="loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="i in 3" :key="i" class="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-5 h-32" />
    </div>

    <div v-else-if="error" class="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">{{ error }}</div>

    <template v-else>
      <div v-if="characters.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="ch in characters"
          :key="ch.id"
          :to="`/characters/${ch.id}`"
          class="block rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-violet-400/30 hover:bg-white/[0.07]"
        >
          <div class="flex items-start justify-between gap-2">
            <h3 class="text-lg font-semibold text-zinc-100">{{ ch.name }}</h3>
            <span v-if="ch.isAdult" class="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-300">18+</span>
          </div>
          <p v-if="ch.description" class="mt-1 line-clamp-2 text-sm text-zinc-400">{{ ch.description }}</p>
          <div class="mt-4 flex flex-wrap gap-3 text-xs text-zinc-500">
            <span><span class="font-medium text-zinc-300">{{ activeCampaignsByCharacter.get(ch.id) ?? 0 }}</span> campanha(s) ativa(s)</span>
            <span v-if="lastGenerationByCharacter.get(ch.id)">Último conteúdo {{ formatCharacterCreatedAt(lastGenerationByCharacter.get(ch.id)) }}</span>
            <span v-else>Sem gerações</span>
          </div>
        </NuxtLink>
      </div>

      <div v-else class="rounded-2xl border border-dashed border-white/10 p-10 text-center">
        <p class="text-zinc-400">Nenhum personagem criado.</p>
        <NuxtLink to="/characters" class="mt-2 inline-block text-sm text-violet-400 hover:underline">Criar primeiro personagem</NuxtLink>
      </div>

      <div v-if="usage" class="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 class="text-sm font-medium text-zinc-400">Uso mensal</h2>
        <div class="mt-3 grid gap-4 sm:grid-cols-3">
          <div><p class="text-2xl font-semibold text-violet-400">{{ usage.imageCount ?? 0 }}</p><p class="mt-0.5 text-xs text-zinc-500">Imagens geradas</p></div>
          <div><p class="text-2xl font-semibold text-sky-400">{{ usage.videoCount ?? 0 }}</p><p class="mt-0.5 text-xs text-zinc-500">Vídeos gerados</p></div>
          <div><p class="text-2xl font-semibold text-emerald-400">${{ Number(usage.estimatedCostUsd ?? 0).toFixed(2) }}</p><p class="mt-0.5 text-xs text-zinc-500">Custo estimado</p></div>
        </div>
      </div>
    </template>
  </section>
</template>
