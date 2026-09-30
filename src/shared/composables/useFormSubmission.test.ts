import { describe, expect, it, vi } from 'vitest'
import { useFormSubmission } from './useFormSubmission'
describe('shared submission lifecycle', () => {
  it('ignores invalid submits and prevents concurrent writes', async () => {
    const state = useFormSubmission()
    let finish!: () => void
    const action = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        }),
    )
    expect(await state.submit(false, {}, action)).toBe(false)
    const pending = state.submit(true, {}, action)
    expect(state.busy.value).toBe(true)
    expect(await state.submit(true, {}, action)).toBe(false)
    expect(action).toHaveBeenCalledTimes(1)
    finish()
    await pending
    expect(state.busy.value).toBe(false)
  })
  it('keeps the retry key after failure, resets it after success, and runs effects only on success', async () => {
    const state = useFormSubmission()
    const keys: string[] = []
    let failing = true
    const action = async (headers: Record<string, string>) => {
      keys.push(headers['Idempotency-Key']!)
      if (failing) throw new Error('failed')
    }
    const success = vi.fn()
    expect(await state.submit(true, { name: 'A' }, action, success)).toBe(false)
    expect(state.error.value).not.toBeNull()
    expect(success).not.toHaveBeenCalled()
    failing = false
    expect(await state.submit(true, { name: 'A' }, action, success)).toBe(true)
    expect(state.error.value).toBeNull()
    await state.submit(true, { name: 'A' }, action, success)
    expect(keys[0]).toBe(keys[1])
    expect(keys[1]).not.toBe(keys[2])
    expect(success).toHaveBeenCalledTimes(2)
  })
  it('changes keys when the submitted payload changes', async () => {
    const state = useFormSubmission()
    const keys: string[] = []
    const fail = async (headers: Record<string, string>) => {
      keys.push(headers['Idempotency-Key']!)
      throw new Error('failed')
    }
    await state.submit(true, { name: 'A' }, fail)
    await state.submit(true, { name: 'B' }, fail)
    expect(keys[0]).not.toBe(keys[1])
  })
})

it('preserves the write key if a post-save effect fails before completing the flow', async () => {
  const state = useFormSubmission()
  const action = vi
    .fn<(headers: Record<string, string>) => Promise<void>>()
    .mockResolvedValue(undefined)
  await state.submit(true, { name: 'A' }, action, async () => {
    throw new Error('navigation failed')
  })
  await state.submit(true, { name: 'A' }, action)
  expect(action.mock.calls[0]![0]).toEqual(action.mock.calls[1]![0])
})
