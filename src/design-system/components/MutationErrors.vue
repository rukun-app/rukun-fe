<script setup lang="ts">
import Message from 'primevue/message'
import { tr } from '@/i18n'
import type { NormalizedApiError } from '@/api/errors/types'
defineProps<{ error: NormalizedApiError | null }>()
</script>
<template>
  <Message v-if="error" severity="error" :closable="false">
    <p>{{ error.message }}</p>
    <ul v-for="(messages, field) in error.fieldErrors" :key="field">
      <li v-for="message in messages" :key="message">{{ message }}</li>
    </ul>
    <p v-if="error.requestId" class="text-xs">{{ tr('ID bantuan:') }} {{ error.requestId }}</p>
  </Message>
</template>
