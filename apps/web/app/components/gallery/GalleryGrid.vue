<script setup lang="ts">
defineProps<{ items: any[] }>()
const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
    <GalleryItem
      v-for="item in items"
      :key="item.id"
      :item="item"
      @click="emit('select', item.id)"
    />
  </div>
</template>
