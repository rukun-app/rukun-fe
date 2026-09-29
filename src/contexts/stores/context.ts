import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { queryClient } from '@/app/providers/query'

export interface ContextScope {
  type: string
  id: string
}

export interface UserContext {
  id: string
  type: string
  label: string
  scope: ContextScope
  capabilities: string[]
}

export const useContextStore = defineStore('context', () => {
  const availableContexts = ref<UserContext[]>([])
  const activeContextId = ref<string | null>(null)

  const activeContext = computed(
    () => availableContexts.value.find((c) => c.id === activeContextId.value) ?? null,
  )

  const capabilities = computed(() => activeContext.value?.capabilities ?? [])

  function can(capability: string): boolean {
    return capabilities.value.includes(capability)
  }

  function setContexts(contexts: UserContext[]): void {
    availableContexts.value = contexts
    if (!contexts.some((context) => context.id === activeContextId.value)) {
      queryClient.clear()
      activeContextId.value = null
    }
  }

  function switchContext(contextId: string): boolean {
    const valid = availableContexts.value.some((c) => c.id === contextId)
    if (!valid) return false
    if (activeContextId.value !== contextId) {
      void queryClient.cancelQueries()
      queryClient.clear()
    }
    activeContextId.value = contextId
    return true
  }

  function clearContexts(): void {
    queryClient.clear()
    availableContexts.value = []
    activeContextId.value = null
  }

  return {
    availableContexts,
    activeContextId,
    activeContext,
    capabilities,
    can,
    setContexts,
    switchContext,
    clearContexts,
  }
})
