<script setup lang="ts">
import BrandMark from '@/app/components/BrandMark.vue'
import SessionActions from '@/auth/components/SessionActions.vue'
</script>
<template>
  <main class="max-w-6xl mx-auto p-4 sm:p-8">
    <header class="flex items-center justify-between gap-4 mb-8">
      <BrandMark /><SessionActions />
    </header>
    <RouterView />
  </main>
</template>
