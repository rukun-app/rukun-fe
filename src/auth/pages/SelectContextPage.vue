<script setup lang="ts">
/**
 * SelectContextPage — shown when user is authenticated but has no active context,
 * or navigated to a shell that doesn't match the current active context type.
 */
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useContextStore } from '@/contexts/stores/context'
import ContextSwitcher from '@/auth/components/ContextSwitcher.vue'

const router = useRouter()
const route = useRoute()
const ctxStore = useContextStore()

const hasContexts = computed(() => ctxStore.availableContexts.length > 0)

async function onSwitched() {
  const redirect = route.query['redirect'] as string | undefined
  if (redirect && redirect.startsWith('/')) {
    await router.replace(redirect)
    return
  }
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
  <div class="w-full max-w-sm mx-auto px-4">
    <div class="mb-6 text-center">
      <div
        class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 mb-3"
      >
        <i class="pi pi-users text-primary-600 dark:text-primary-400 text-xl" />
      </div>
      <h1 class="text-xl font-bold text-surface-900 dark:text-surface-0">Pilih Akses</h1>
      <p class="text-surface-500 mt-1 text-sm">
        Pilih peran yang ingin Anda gunakan untuk sesi ini.
      </p>
    </div>

    <div
      v-if="!hasContexts"
      role="status"
      class="rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-700 dark:text-amber-300 text-center"
    >
      Tidak ada akses yang tersedia untuk akun ini.
      <br />
      Hubungi administrator untuk mendapatkan akses.
    </div>

    <div v-else class="rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
      <ContextSwitcher @switched="onSwitched" />
    </div>
  </div>
</template>
