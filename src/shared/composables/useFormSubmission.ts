import { ref } from 'vue'
import { createIntentKey } from '@/shared/utils/idempotency'
import { normalizeApiError } from '@/api/errors/normalizer'
import type { NormalizedApiError } from '@/api/errors/types'
/** Shared submission lifecycle; payload construction and cache/navigation stay with the feature. */
export function useFormSubmission() {
  const busy = ref(false)
  const error = ref<NormalizedApiError | null>(null)
  let intentKey = createIntentKey()
  async function submit(
    valid: boolean,
    payload: unknown,
    action: (headers: Record<string, string>) => Promise<unknown>,
    onSuccess?: () => Promise<void> | void,
  ) {
    if (!valid || busy.value) return false
    busy.value = true
    error.value = null
    try {
      await action({ 'Idempotency-Key': intentKey(payload) })
      await onSuccess?.()
      // Rotate only after the whole flow succeeds; an effect failure must keep the retry key.
      intentKey = createIntentKey()
      return true
    } catch (cause) {
      error.value = normalizeApiError(cause)
      return false
    } finally {
      busy.value = false
    }
  }
  return { busy, error, submit }
}
