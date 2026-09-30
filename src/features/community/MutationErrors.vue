<script setup lang="ts">
import { tr } from '@/i18n'
import type { NormalizedApiError } from '@/api/errors/types'
defineProps<{ error: NormalizedApiError | null }>()
</script>
<template>
  <div
    v-if="error"
    role="alert"
    class="rounded-lg bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200 p-4 space-y-2"
  >
    <p>{{ error.message }}</p>
    <ul v-for="(messages, field) in error.fieldErrors" :key="field">
      <li v-for="message in messages" :key="message">{{ message }}</li>
    </ul>
    <p v-if="error.requestId" class="text-xs">{{ tr('ID bantuan:') }} {{ error.requestId }}</p>
  </div>
</template>
