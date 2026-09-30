import { afterEach, describe, expect, it } from 'vitest'
import { membershipPayload, householdAddress, membershipDate } from './membership'
import { setLocale } from '@/i18n'
const household = '10000000-0000-4000-8000-000000000001'
afterEach(() => setLocale('id'))
describe('membership contract', () => {
  it('requires an explicit valid destination and relationship for transfer', () => {
    expect(() =>
      membershipPayload({ mode: 'move', household_id: '', relationship: 'child' }),
    ).toThrow()
    expect(() =>
      membershipPayload({ mode: 'move', household_id: household, relationship: '' }),
    ).toThrow()
    expect(() =>
      membershipPayload({ mode: 'move', household_id: household, relationship: 'admin' }),
    ).toThrow()
    expect(
      membershipPayload({
        mode: 'move',
        household_id: household,
        relationship: 'child',
        nik: 'ignored',
      }),
    ).toEqual({ household_id: household, relationship: 'child' })
  })
  it('ends membership with explicit null and required backend relationship, ignoring hidden stale fields', () => {
    expect(
      membershipPayload({ mode: 'end', household_id: household, relationship: 'head' }),
    ).toEqual({ household_id: null, relationship: 'other' })
  })
  it('never substitutes internal IDs or references for an unavailable address', () => {
    expect(householdAddress({ public_id: household, reference: 'private-ref' })).toBe(
      'Alamat belum tersedia',
    )
    expect(householdAddress({ address: 'Jl Mawar', block: 'B', house_number: '2' })).toBe(
      'Jl Mawar · B · 2',
    )
    expect(householdAddress()).toBe('Keluarga tidak tersedia')
  })
  it('formats only valid server timestamps and follows the UI locale', () => {
    expect(membershipDate(null)).toBe('—')
    expect(membershipDate('bad')).toBe('—')
    setLocale('en')
    expect(membershipDate('2026-09-01T12:00:00Z')).toContain('Sept')
  })
})
