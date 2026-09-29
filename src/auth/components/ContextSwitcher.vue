<script setup lang="ts">
/**
 * ContextSwitcher — shown when user has multiple contexts.
 * Emits 'switched' after a successful context change.
 */
import { computed } from 'vue'
import { useContextStore } from '@/contexts/stores/context'

const emit = defineEmits<{ switched: [] }>()

const ctxStore = useContextStore()

const contexts = computed(() => ctxStore.availableContexts)
const activeId = computed(() => ctxStore.activeContextId)

const typeLabel: Record<string, string> = {
  household: 'Warga',
  management: 'Pengurus',
  vendor: 'Vendor',
  system: 'System',
}

const typeIcon: Record<string, string> = {
  household: 'pi-home',
  management: 'pi-sitemap',
  vendor: 'pi-box',
  system: 'pi-server',
}

function select(contextId: string) {
  const ok = ctxStore.switchContext(contextId)
  if (!ok) return
  emit('switched')
}
</script>

<template>
  <ul role="listbox" aria-label="Pilih konteks" class="flex flex-col gap-1 py-1 min-w-[200px]">
    <li v-if="contexts.length === 0" class="px-4 py-2 text-sm text-surface-400">
      Tidak ada konteks tersedia
    </li>
    <li
      v-for="ctx in contexts"
      :key="ctx.id"
      role="option"
      :aria-selected="ctx.id === activeId"
      class="group"
    >
      <button
        type="button"
        class="w-full flex items-center gap-3 px-4 py-2.5 text-left rounded-lg transition-colors hover:bg-surface-100 dark:hover:bg-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 aria-[selected=true]:bg-primary-50 dark:aria-[selected=true]:bg-primary-950 aria-[selected=true]:text-primary-700 dark:aria-[selected=true]:text-primary-300"
        :aria-current="ctx.id === activeId ? 'true' : undefined"
        @click="select(ctx.id)"
      >
        <span
          class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-700 group-[&[aria-selected=true]]:bg-primary-100 dark:group-[&[aria-selected=true]]:bg-primary-900 shrink-0"
        >
          <i :class="`pi ${typeIcon[ctx.type] ?? 'pi-user'} text-sm`" />
        </span>
        <span class="flex flex-col min-w-0">
          <span class="text-sm font-medium truncate">{{ ctx.label }}</span>
          <span class="text-xs text-surface-400">{{ typeLabel[ctx.type] ?? ctx.type }}</span>
        </span>
        <i
          v-if="ctx.id === activeId"
          class="pi pi-check ml-auto text-primary-600 dark:text-primary-400 text-xs shrink-0"
        />
      </button>
    </li>
  </ul>
</template>
