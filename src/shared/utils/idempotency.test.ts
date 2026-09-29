import { describe, expect, it } from 'vitest'
import { createIntentKey } from './idempotency'

describe('idempotent create intent', () => {
  it('keeps the key when retrying an unchanged payload after a network failure', () => {
    const key = createIntentKey()
    expect(key({ address: 'Melati 1' })).toBe(key({ address: 'Melati 1' }))
  })
  it('assigns a new key to corrected input instead of causing a payload conflict', () => {
    const key = createIntentKey()
    const first = key({ address: 'Melati 1' })
    expect(key({ address: 'Melati 2' })).not.toBe(first)
  })
  it('does not reuse a previous form submission key in a new form', () => {
    expect(createIntentKey()({ name: 'Warga' })).not.toBe(createIntentKey()({ name: 'Warga' }))
  })
})
