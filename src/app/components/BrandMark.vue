<script setup lang="ts">
withDefaults(defineProps<{ light?: boolean; compact?: boolean }>(), {
  light: false,
  compact: false,
})
</script>
<template>
  <span class="brand" :class="{ 'brand-light': light }" aria-label="Rukun">
    <span class="brand-symbol" aria-hidden="true"><i /><i /><i /><i /></span>
    <span v-if="!compact" class="brand-word">rukun<span>.</span></span>
  </span>
</template>
