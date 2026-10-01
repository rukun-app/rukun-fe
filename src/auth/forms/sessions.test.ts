import { describe, expect, it } from 'vitest'
import { sessionLabel, sessionRevocation } from './sessions'
describe('session revocation metadata', () => {
  it('uses a readable fallback without exposing the numeric ID', () => {
    expect(sessionLabel({ name: ' ' })).toBe('Perangkat tanpa nama')
    expect(sessionLabel({ name: ' Browser rumah ' })).toBe('Browser rumah')
  })
  it('uses the server current marker, not the device name, and snapshots the target', () => {
    const row = { id: 5, name: 'Browser', is_current: false }
    const action = sessionRevocation(row)
    row.id = 6
    expect(action).toEqual({ id: 5, label: 'Browser', signsOut: false })
    expect(sessionRevocation({ ...row, is_current: true })?.signsOut).toBe(true)
  })
  it('rejects invalid target IDs before a request can be made', () => {
    for (const id of [0, -1, 1.5, NaN, Infinity])
      expect(sessionRevocation({ id, name: 'Browser', is_current: false })).toBeNull()
  })
})
