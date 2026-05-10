<script setup lang="ts">
interface FormValues {
  name: string
  description: string
  triggerWord: string
  isAdult: boolean
}

const props = withDefaults(
  defineProps<{
    initialValues?: Partial<FormValues>
    submitLabel?: string
    submitting?: boolean
  }>(),
  {
    submitLabel: 'Create',
    submitting: false,
  },
)

const emit = defineEmits<{
  submit: [values: FormValues]
}>()

const name = ref(props.initialValues?.name ?? '')
const description = ref(props.initialValues?.description ?? '')
const triggerWord = ref(props.initialValues?.triggerWord ?? '')
const isAdult = ref(props.initialValues?.isAdult ?? false)
const triedSubmit = ref(false)

const nameError = computed(() => {
  if (!triedSubmit.value) return ''
  return name.value.trim() === '' ? 'Name is required' : ''
})

function handleSubmit() {
  triedSubmit.value = true
  if (nameError.value) return
  emit('submit', {
    name: name.value.trim(),
    description: description.value.trim(),
    triggerWord: triggerWord.value.trim(),
    isAdult: isAdult.value,
  })
}
</script>

<template>
  <form class="space-y-5" @submit.prevent="handleSubmit">
    <div>
      <label for="char-name" class="mb-1 block text-sm font-medium text-zinc-300">Name</label>
      <input
        id="char-name"
        v-model="name"
        type="text"
        class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-violet-400/50"
        placeholder="Character name"
      />
      <p v-if="nameError" class="mt-1 text-xs text-rose-400">{{ nameError }}</p>
    </div>

    <div>
      <label for="char-desc" class="mb-1 block text-sm font-medium text-zinc-300">Description</label>
      <textarea
        id="char-desc"
        v-model="description"
        rows="3"
        class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-violet-400/50"
        placeholder="Optional description"
      />
    </div>

    <div>
      <label for="char-trigger" class="mb-1 block text-sm font-medium text-zinc-300">Trigger Word</label>
      <input
        id="char-trigger"
        v-model="triggerWord"
        type="text"
        class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-violet-400/50"
        placeholder="Optional trigger word"
      />
    </div>

    <div class="flex items-center gap-2">
      <input
        id="char-adult"
        v-model="isAdult"
        type="checkbox"
        class="h-4 w-4 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-400"
      />
      <label for="char-adult" class="text-sm text-zinc-300">Adult content</label>
    </div>

    <button
      type="submit"
      :disabled="submitting"
      class="rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-400 disabled:opacity-50"
    >
      {{ submitting ? 'Saving…' : submitLabel }}
    </button>
  </form>
</template>
