import { describe, expect, it } from 'vitest'
import {
  clonePreferences,
  parsePreferences,
  preferencesChanged,
  preferencesPayload,
} from './preferences'
const response = () => ({
  success: true,
  data: [
    {
      category: 'security',
      database_enabled: true,
      mail_enabled: true,
      locked_channels: ['database', 'mail'],
    },
    {
      category: 'account',
      database_enabled: true,
      mail_enabled: true,
      locked_channels: ['database'],
    },
    { category: 'system', database_enabled: true, mail_enabled: false, locked_channels: [] },
  ],
})
describe('notification preference boundary', () => {
  it('reads effective values and dynamic locks from the server', () => {
    const value = response()
    value.data[2]!.locked_channels = ['database']
    expect(parsePreferences(value)[2]!.locked_channels).toEqual(['database'])
  })
  it('rejects missing fields, unknown categories and inconsistent required channels', () => {
    expect(() => parsePreferences({ success: true, data: [{ category: 'account' }] })).toThrow()
    const value = response()
    value.data[0]!.mail_enabled = false
    expect(() => parsePreferences(value)).toThrow()
    value.data[0]!.category = 'unexpected'
    expect(() => parsePreferences(value)).toThrow()
  })
  it('rejects empty, duplicated and unsuccessful responses', () => {
    expect(() => parsePreferences({ success: true, data: [] })).toThrow()
    const value = response()
    value.data.push(value.data[0]!)
    expect(() => parsePreferences(value)).toThrow()
    expect(() => parsePreferences({ ...response(), success: false })).toThrow()
  })
  it('clones values and lock arrays so edits do not alter the baseline', () => {
    const baseline = parsePreferences(response())
    const draft = clonePreferences(baseline)
    draft[1]!.mail_enabled = false
    draft[1]!.locked_channels.length = 0
    expect(baseline[1]!.mail_enabled).toBe(true)
    expect(baseline[1]!.locked_channels).toEqual(['database'])
    expect(preferencesChanged(draft, baseline)).toBe(true)
    expect(preferencesChanged(clonePreferences(baseline), baseline)).toBe(false)
  })
  it('sends only changed rows and whitelists writable fields', () => {
    const baseline = parsePreferences(response())
    const draft = clonePreferences(baseline)
    draft[1]!.mail_enabled = false
    expect(preferencesPayload(draft, baseline)).toEqual({
      preferences: [{ category: 'account', database_enabled: true, mail_enabled: false }],
    })
    expect(preferencesPayload(baseline, baseline)).toEqual({ preferences: [] })
  })
  it('enforces original server locks even if draft lock metadata is altered', () => {
    const baseline = parsePreferences(response())
    const draft = clonePreferences(baseline)
    draft[0]!.locked_channels = []
    draft[0]!.mail_enabled = false
    expect(() => preferencesPayload(draft, baseline)).toThrow()
  })
  it('does not allow a category to disappear from the draft', () => {
    const baseline = parsePreferences(response())
    expect(() => preferencesPayload(baseline.slice(1), baseline)).toThrow()
  })
})
