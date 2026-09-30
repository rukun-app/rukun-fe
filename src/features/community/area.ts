import { z } from 'zod'
import { tr } from '@/i18n'
import type { CreateArea, UpdateArea } from '@/api/generated/models'
import { areaKinds } from './options'

export function areaFieldsSchema() {
  return z.object({
    code: z.string().trim().min(1, tr('Kode wajib diisi')).max(20, tr('Kode maksimal 20 karakter')),
    name: z
      .string()
      .trim()
      .min(1, tr('Nama wilayah wajib diisi'))
      .max(100, tr('Nama wilayah maksimal 100 karakter')),
  })
}

export function createAreaSchema() {
  return areaFieldsSchema()
    .extend({
      kind: z.enum(areaKinds),
      parent_id: z.string().optional(),
    })
    .superRefine((value, ctx) => {
      if (value.kind === 'rt' && !z.string().uuid().safeParse(value.parent_id).success)
        ctx.addIssue({
          code: 'custom',
          path: ['parent_id'],
          message: tr('Pilih RW induk untuk RT'),
        })
    })
}

export function createAreaPayload(values: unknown): CreateArea {
  const { kind, code, name, parent_id } = createAreaSchema().parse(values)
  return { kind, code, name, ...(kind === 'rt' ? { parent_id } : {}) }
}

/** The API forbids changing kind/parent; never forward form or response extras. */
export function updateAreaPayload(values: unknown): UpdateArea {
  return areaFieldsSchema().parse(values)
}
