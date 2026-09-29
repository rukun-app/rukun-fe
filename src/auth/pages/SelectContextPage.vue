<script setup lang="ts">
/**
 * SelectContextPage — shown when user is authenticated but has no active context,
 * or navigated to a shell that doesn't match the current active context type.
 */
import { computed } from 'vue'
import Button from 'primevue/button'
import { useAuth } from '@/auth/composables/useAuth'
import { useRouter } from 'vue-router'
import { useContextStore } from '@/contexts/stores/context'
import ContextSwitcher from '@/auth/components/ContextSwitcher.vue'

const { logout, loading } = useAuth()
const router = useRouter()
const ctxStore = useContextStore()

const hasContexts = computed(() => ctxStore.availableContexts.length > 0)

async function onSwitched() {
  // resolveAuthenticatedHome logic — duplicate-free by delegating to the guard
  const ctxType = ctxStore.activeContext?.type
  const map: Record<string, string> = {
    household: 'app.home',
    management: 'manage.dashboard',
    vendor: 'vendor.dashboard',
    system: 'system.overview',
  }
  await router.replace({ name: map[ctxType ?? ''] ?? 'app.home' })
}
</script>

<template>
  <div class="auth-page access-page">
    <div class="auth-page-heading">
      <span class="eyebrow">SATU AKUN, BERBAGAI PERAN</span>
      <h1>Pilih ruang Anda.</h1>
      <p>Pilih akses untuk melanjutkan.<br />Anda dapat berganti akses kapan saja.</p>
    </div>
    <div v-if="!hasContexts" role="status" class="access-empty">
      <i class="pi pi-lock" aria-hidden="true" />
      <p>
        Tidak ada akses yang tersedia untuk akun ini.<br />Hubungi administrator untuk mendapatkan
        akses.
      </p>
    </div>
    <ContextSwitcher v-else @switched="onSwitched" />
    <Button
      label="Keluar"
      icon="pi pi-sign-out"
      severity="secondary"
      text
      :loading="loading"
      class="access-logout"
      @click="logout"
    />
  </div>
</template>
