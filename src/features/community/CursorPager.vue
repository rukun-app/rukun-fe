<script setup lang="ts">
import Button from 'primevue/button'
defineProps<{ next?: string | null; previous?: string | null; busy?: boolean }>()
const emit = defineEmits<{ change: [cursor: string] }>()
</script>
<template>
  <nav aria-label="Halaman data" class="cursor-pager">
    <Button
      label="Sebelumnya"
      icon="pi pi-angle-left"
      severity="secondary"
      outlined
      :disabled="!previous || busy"
      @click="previous && emit('change', previous)"
    /><Button
      label="Berikutnya"
      icon="pi pi-angle-right"
      icon-pos="right"
      severity="secondary"
      outlined
      :disabled="!next || busy"
      @click="next && emit('change', next)"
    />
  </nav>
</template>
