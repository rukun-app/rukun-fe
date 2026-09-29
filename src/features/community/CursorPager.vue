<script setup lang="ts">
import Button from 'primevue/button'
defineProps<{ next?: string | null; previous?: string | null; busy?: boolean }>()
const emit = defineEmits<{ change: [cursor: string] }>()
</script>
<template>
  <nav aria-label="Halaman data" class="flex gap-3 justify-end mt-4">
    <Button
      label="Sebelumnya"
      severity="secondary"
      :disabled="!previous || busy"
      @click="previous && emit('change', previous)"
    /><Button
      label="Berikutnya"
      severity="secondary"
      :disabled="!next || busy"
      @click="next && emit('change', next)"
    />
  </nav>
</template>
