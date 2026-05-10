<script setup lang="ts">
const props = withDefaults(defineProps<{
  accept?: string
  label?: string
  hint?: string
  disabled?: boolean
}>(), {
  accept: 'image/jpeg,image/png,image/webp',
  label: 'Upload file',
  hint: 'JPEG, PNG, or WEBP up to 10MB.',
  disabled: false,
})

const emit = defineEmits<{ select: [file: File] }>()
const inputId = `file-upload-${Math.random().toString(36).slice(2)}`

function onChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  emit('select', file)
  input.value = ''
}
</script>

<template>
  <label
    :for="inputId"
    class="block cursor-pointer rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center transition hover:border-violet-400/40 hover:bg-violet-400/5"
    :class="{ 'cursor-not-allowed opacity-60': props.disabled }"
  >
    <input :id="inputId" type="file" :accept="accept" :disabled="disabled" class="sr-only" @change="onChange">
    <span class="block text-sm font-semibold text-zinc-100">{{ label }}</span>
    <span class="mt-1 block text-xs text-zinc-500">{{ hint }}</span>
  </label>
</template>
