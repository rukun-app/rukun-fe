import { describe, expect, it } from 'vitest'
import { referenceOptions } from './referenceOptions'
describe('reference options', () => {
  const areas = [
    { public_id: 'rw-id', kind: 'rw' as const, name: 'RW Melati', code: '01' },
    { public_id: 'rt-id', kind: 'rt' as const, name: 'RT Mawar', code: '02' },
    { kind: 'rt' as const, name: 'No ID' },
  ]
  it('allows only RW parents for RT, without displaying UUIDs', () => {
    expect(referenceOptions('rw', areas)).toEqual([{ value: 'rw-id', label: 'RW Melati · 01' }])
  })
  it('allows only RT for households and excludes incomplete records', () => {
    expect(referenceOptions('rt', areas)).toEqual([{ value: 'rt-id', label: 'RT Mawar · 02' }])
  })
  it('labels households with their reference and address, preserving the API ID', () => {
    expect(
      referenceOptions('household', [
        {
          public_id: 'id',
          reference: 'KK-001',
          address: 'Jl Melati',
          block: 'A',
          house_number: '2',
        },
      ]),
    ).toEqual([{ value: 'id', label: 'KK-001 · Jl Melati · A · 2' }])
  })
})
