import { afterEach, expect, it } from 'vitest'
import { setLocale } from '@/i18n'
import { householdStatuses, residentStatuses, recordOptions, recordLabel } from './options'
afterEach(() => setLocale('id'))
it('keeps domain-specific statuses separate and preserves API values during translation', () => {
  expect(householdStatuses).not.toContain('deceased')
  expect(residentStatuses).toContain('deceased')
  setLocale('en')
  expect(recordOptions(householdStatuses)[0]).toEqual({ value: 'active', label: 'Active' })
  expect(recordLabel('internal-unknown')).toBe('Unavailable')
  setLocale('id')
  expect(recordOptions(householdStatuses)[0]).toEqual({ value: 'active', label: 'Aktif' })
})
