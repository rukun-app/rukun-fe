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
  <ul aria-label="Pilihan akses" class="access-options">
    <li v-if="contexts.length === 0">Tidak ada konteks tersedia</li>
    <li v-for="ctx in contexts" :key="ctx.id">
      <button
        type="button"
        class="access-option"
        :class="{ selected: ctx.id === activeId }"
        :aria-current="ctx.id === activeId ? 'true' : undefined"
        @click="select(ctx.id)"
      >
        <span class="access-option-icon"
          ><i :class="`pi ${typeIcon[ctx.type] ?? 'pi-user'}`" aria-hidden="true" /></span
        ><span
          ><strong>{{ ctx.label }}</strong
          ><small>{{ typeLabel[ctx.type] ?? ctx.type }}</small></span
        ><i class="pi pi-arrow-right" aria-hidden="true" />
      </button>
    </li>
  </ul>
</template>
