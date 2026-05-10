<script setup lang="ts">
interface CampaignFormValues {
  influencerProfileId: string
  name: string
  goal: string
  platform: string
  contentRating: string
  startsAt: string
  endsAt: string
}

const props = withDefaults(defineProps<{
  initialValues?: Partial<CampaignFormValues>
  submitLabel?: string
  submitting?: boolean
}>(), {
  submitLabel: 'Save campaign',
  submitting: false,
})

const emit = defineEmits<{ submit: [values: Record<string, unknown>] }>()

const form = reactive<CampaignFormValues>({
  influencerProfileId: props.initialValues?.influencerProfileId || '',
  name: props.initialValues?.name || '',
  goal: props.initialValues?.goal || '',
  platform: props.initialValues?.platform || 'instagram',
  contentRating: props.initialValues?.contentRating || 'sfw',
  startsAt: props.initialValues?.startsAt ? props.initialValues.startsAt.slice(0, 10) : '',
  endsAt: props.initialValues?.endsAt ? props.initialValues.endsAt.slice(0, 10) : '',
})

const attempted = shallowRef(false)
const nameError = computed(() => attempted.value && !form.name.trim() ? 'Name is required' : '')
const personaError = computed(() => attempted.value && !form.influencerProfileId.trim() ? 'Persona ID is required' : '')

function toDateTime(value: string) {
  return value ? new Date(`${value}T00:00:00`).toISOString() : undefined
}

function onSubmit() {
  attempted.value = true
  if (nameError.value || personaError.value) return

  emit('submit', {
    influencerProfileId: form.influencerProfileId.trim(),
    name: form.name.trim(),
    goal: form.goal.trim() || undefined,
    platform: form.platform,
    contentRating: form.contentRating,
    startsAt: toDateTime(form.startsAt),
    endsAt: toDateTime(form.endsAt),
  })
}
</script>

<template>
  <form class="max-w-3xl space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6" @submit.prevent="onSubmit">
    <div class="grid gap-5 md:grid-cols-2">
      <label class="space-y-2 md:col-span-2">
        <span class="text-sm font-medium text-zinc-300">Influencer persona ID</span>
        <input
          v-model="form.influencerProfileId"
          class="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-violet-400"
          placeholder="UUID from a persona profile"
        >
        <span v-if="personaError" class="text-xs text-red-300">{{ personaError }}</span>
      </label>

      <label class="space-y-2 md:col-span-2">
        <span class="text-sm font-medium text-zinc-300">Campaign name</span>
        <input
          v-model="form.name"
          class="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-violet-400"
          placeholder="Golden hour launch week"
        >
        <span v-if="nameError" class="text-xs text-red-300">{{ nameError }}</span>
      </label>

      <label class="space-y-2 md:col-span-2">
        <span class="text-sm font-medium text-zinc-300">Goal</span>
        <textarea
          v-model="form.goal"
          rows="4"
          class="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-violet-400"
          placeholder="Create SFW fashion portraits for Instagram launch content."
        />
      </label>

      <label class="space-y-2">
        <span class="text-sm font-medium text-zinc-300">Platform</span>
        <select v-model="form.platform" class="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-400">
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
          <option value="x">X</option>
          <option value="youtube_shorts">YouTube Shorts</option>
          <option value="other">Other</option>
        </select>
      </label>

      <label class="space-y-2">
        <span class="text-sm font-medium text-zinc-300">Content rating</span>
        <select v-model="form.contentRating" class="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-400">
          <option value="sfw">SFW</option>
          <option value="suggestive">Suggestive</option>
        </select>
      </label>

      <label class="space-y-2">
        <span class="text-sm font-medium text-zinc-300">Starts</span>
        <input v-model="form.startsAt" type="date" class="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-400">
      </label>

      <label class="space-y-2">
        <span class="text-sm font-medium text-zinc-300">Ends</span>
        <input v-model="form.endsAt" type="date" class="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-400">
      </label>
    </div>

    <button
      type="submit"
      :disabled="submitting"
      class="rounded-full bg-violet-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {{ submitting ? 'Saving…' : submitLabel }}
    </button>
  </form>
</template>
