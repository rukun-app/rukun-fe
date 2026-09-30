import { afterEach, describe, expect, it } from 'vitest'
import { setLocale } from '@/i18n'
import { createAreaPayload, updateAreaPayload } from './area'
const parent = '10000000-0000-4000-8000-000000000001'
afterEach(() => setLocale('id'))

describe('area API payloads', () => {
  it('updates only trimmed code and name, excluding immutable hierarchy and response fields', () => {
    expect(
      updateAreaPayload({
        code: ' 02 ',
        name: ' RT Melati ',
        kind: 'rw',
        parent_id: parent,
        public_id: parent,
      }),
    ).toEqual({ code: '02', name: 'RT Melati' })
  })
  it('rejects blank fields and backend length violations for create and update', () => {
    for (const fields of [
      { code: ' ', name: 'RT' },
      { code: '01', name: ' ' },
      { code: 'x'.repeat(21), name: 'RT' },
      { code: '01', name: 'x'.repeat(101) },
    ]) {
      expect(() => updateAreaPayload(fields)).toThrow()
      expect(() => createAreaPayload({ ...fields, kind: 'rw' })).toThrow()
    }
    expect(updateAreaPayload({ code: 'x'.repeat(20), name: 'x'.repeat(100) })).toBeDefined()
  })
  it('requires a valid RW reference for an RT', () => {
    for (const parent_id of [undefined, '', 'not-a-uuid'])
      expect(() => createAreaPayload({ kind: 'rt', code: '01', name: 'RT', parent_id })).toThrow()
    expect(createAreaPayload({ kind: 'rt', code: '01', name: 'RT', parent_id: parent })).toEqual({
      kind: 'rt',
      code: '01',
      name: 'RT',
      parent_id: parent,
    })
  })
  it('omits stale hidden parent values when creating RW', () => {
    expect(
      createAreaPayload({ kind: 'rw', code: ' 01 ', name: ' RW ', parent_id: parent }),
    ).toEqual({ kind: 'rw', code: '01', name: 'RW' })
  })
  it('uses the selected language for validation', () => {
    setLocale('en')
    expect(() => updateAreaPayload({ code: '', name: 'RT' })).toThrow('Code is required')
    expect(() => updateAreaPayload({ code: 'x'.repeat(21), name: 'RT' })).toThrow(
      'Code must be at most 20 characters',
    )
  })
})
