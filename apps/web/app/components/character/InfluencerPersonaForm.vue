<script setup lang="ts">
import { joinListInput, splitListInput } from '../../utils/persona'

type PersonaInput = {
  displayName?: string | null
  niche?: string | null
  audience?: string | null
  backstory?: string | null
  personalityTraits?: string[] | null
  toneOfVoice?: string | null
  languages?: string[] | null
  contentPillars?: string[] | null
  visualStyle?: string | null
  boundaries?: string | null
  sfwPolicy?: string | null
  nsfwPolicy?: string | null
  disclosureNote?: string | null
  [key: string]: unknown
}

const props = withDefaults(defineProps<{
  initialValues?: PersonaInput | null
  submitLabel?: string
  submitting?: boolean
}>(), {
  initialValues: null,
  submitLabel: 'Save persona',
  submitting: false,
})

const emit = defineEmits<{ submit: [values: Record<string, unknown>] }>()

const form = reactive({
  displayName: props.initialValues?.displayName || '',
  niche: props.initialValues?.niche || '',
  audience: props.initialValues?.audience || '',
  backstory: props.initialValues?.backstory || '',
  personalityTraits: joinListInput(props.initialValues?.personalityTraits),
  toneOfVoice: props.initialValues?.toneOfVoice || '',
  languages: joinListInput(props.initialValues?.languages) || 'en',
  contentPillars: joinListInput(props.initialValues?.contentPillars),
  visualStyle: props.initialValues?.visualStyle || '',
  boundaries: props.initialValues?.boundaries || '',
  sfwPolicy: props.initialValues?.sfwPolicy || '',
  nsfwPolicy: props.initialValues?.nsfwPolicy || '',
  disclosureNote: props.initialValues?.disclosureNote || 'Fictional AI influencer. Disclose AI-generated content where required.',
})

const attempted = shallowRef(false)
const displayNameError = computed(() => attempted.value && !form.displayName.trim() ? 'Display name is required' : '')

function emptyToUndefined(value: string) {
  const trimmed = value.trim()
  return trimmed || undefined
}

function onSubmit() {
  attempted.value = true
  if (displayNameError.value) return

  emit('submit', {
    displayName: form.displayName.trim(),
    niche: emptyToUndefined(form.niche),
    audience: emptyToUndefined(form.audience),
    backstory: emptyToUndefined(form.backstory),
    personalityTraits: splitListInput(form.personalityTraits),
    toneOfVoice: emptyToUndefined(form.toneOfVoice),
    languages: splitListInput(form.languages).length ? splitListInput(form.languages) : ['en'],
    contentPillars: splitListInput(form.contentPillars),
    visualStyle: emptyToUndefined(form.visualStyle),
    boundaries: emptyToUndefined(form.boundaries),
    sfwPolicy: emptyToUndefined(form.sfwPolicy),
    nsfwPolicy: emptyToUndefined(form.nsfwPolicy),
    disclosureNote: emptyToUndefined(form.disclosureNote),
  })
}
</script>

<template>
  <form class="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6" @submit.prevent="onSubmit">
    <div class="grid gap-5 lg:grid-cols-2">
      <label class="space-y-2">
        <span class="text-sm font-medium text-zinc-300">Display name</span>
        <input v-model="form.displayName" class="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-400" placeholder="Nova Vale">
        <span v-if="displayNameError" class="text-xs text-red-300">{{ displayNameError }}</span>
      </label>

      <label class="space-y-2">
        <span class="text-sm font-medium text-zinc-300">Niche</span>
        <input v-model="form.niche" class="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-400" placeholder="Luxury fitness and fashion">
      </label>

      <label class="space-y-2 lg:col-span-2">
        <span class="text-sm font-medium text-zinc-300">Audience</span>
        <textarea v-model="form.audience" rows="3" class="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-400" placeholder="Young adults interested in style, wellness, and travel." />
      </label>

      <label class="space-y-2 lg:col-span-2">
        <span class="text-sm font-medium text-zinc-300">Backstory</span>
        <textarea v-model="form.backstory" rows="3" class="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-400" />
      </label>

      <label class="space-y-2">
        <span class="text-sm font-medium text-zinc-300">Personality traits</span>
        <input v-model="form.personalityTraits" class="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-400" placeholder="confident, playful, elegant">
      </label>

      <label class="space-y-2">
        <span class="text-sm font-medium text-zinc-300">Languages</span>
        <input v-model="form.languages" class="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-400" placeholder="en, pt-BR">
      </label>

      <label class="space-y-2 lg:col-span-2">
        <span class="text-sm font-medium text-zinc-300">Content pillars</span>
        <input v-model="form.contentPillars" class="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-400" placeholder="fashion, travel, fitness">
      </label>

      <label class="space-y-2 lg:col-span-2">
        <span class="text-sm font-medium text-zinc-300">Tone of voice</span>
        <textarea v-model="form.toneOfVoice" rows="3" class="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-400" />
      </label>

      <label class="space-y-2 lg:col-span-2">
        <span class="text-sm font-medium text-zinc-300">Visual style</span>
        <textarea v-model="form.visualStyle" rows="3" class="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-400" />
      </label>

      <label class="space-y-2 lg:col-span-2">
        <span class="text-sm font-medium text-zinc-300">Boundaries</span>
        <textarea v-model="form.boundaries" rows="3" class="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-400" placeholder="No explicit nudity, no real-person likeness, no ambiguous age framing." />
      </label>

      <label class="space-y-2 lg:col-span-2">
        <span class="text-sm font-medium text-zinc-300">SFW policy</span>
        <textarea v-model="form.sfwPolicy" rows="3" class="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-400" />
      </label>

      <label class="space-y-2 lg:col-span-2">
        <span class="text-sm font-medium text-zinc-300">Disclosure note</span>
        <textarea v-model="form.disclosureNote" rows="2" class="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-400" />
      </label>
    </div>

    <button type="submit" :disabled="submitting" class="rounded-full bg-violet-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-60">
      {{ submitting ? 'Saving…' : submitLabel }}
    </button>
  </form>
</template>
