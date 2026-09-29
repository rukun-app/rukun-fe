<script setup lang="ts">
import Button from 'primevue/button'
import { useAuth } from '@/auth/composables/useAuth'
const { logout, loading } = useAuth()
</script>
<template>
  <div class="flex gap-2 items-center">
    <RouterLink to="/auth/select-context" class="text-sm text-primary-700 underline"
      >Ganti akses</RouterLink
    ><Button label="Keluar" severity="secondary" size="small" :loading="loading" @click="logout" />
  </div>
</template>
