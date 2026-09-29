<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuth } from '@/auth/composables/useAuth'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

const { hydrate } = useAuth()

// Hydrate user + contexts from /auth/me on every page load when a token exists.
// If the token is expired the 401 interceptor will clear state and redirect.
onMounted(hydrate)
</script>

<template>
  <RouterView />
  <Toast position="top-right" />
  <ConfirmDialog />
</template>
