/** One key per submitted payload; retries of that payload keep the same key. */
export function createIntentKey() {
  let fingerprint: string | undefined
  let key: string | undefined
  return (payload: unknown): string => {
    const next = JSON.stringify(payload)
    if (next !== fingerprint || !key) {
      fingerprint = next
      key = crypto.randomUUID()
    }
    return key
  }
}
