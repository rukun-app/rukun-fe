<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Form, type FormSubmitEvent } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { AppSkeleton, ErrorState, MutationErrors, PageHeader } from '@/design-system'
import { useContextStore } from '@/contexts/stores/context'
import { useFormSubmission } from '@/shared/composables/useFormSubmission'
import { useUnsavedChanges } from '@/shared/composables/useUnsavedChanges'
import { queryClient } from '@/app/providers/query'
import { deleteArea, updateArea } from '@/api/generated/endpoints'
import { normalizeApiError } from '@/api/errors/normalizer'
import { tr } from '@/i18n'
import { areaFieldsSchema, updateAreaPayload } from './area'
import { useArea } from './queries'

const route = useRoute()
const router = useRouter()
const context = useContextStore()
const confirm = useConfirm()
const toast = useToast()
const id = computed(() => String(route.params.id))
const query = useArea(id)
const area = computed(() => query.data.value?.data)
const parentId = computed(() => area.value?.parent_id ?? '')
const parentQuery = useArea(parentId)
const parentLabel = computed(() =>
  parentQuery.isPending.value
    ? tr('Memuat...')
    : parentQuery.isError.value
      ? tr('RW induk tidak tersedia')
      : [parentQuery.data.value?.data?.name, parentQuery.data.value?.data?.code]
          .filter(Boolean)
          .join(' · ') || tr('RW induk tidak tersedia'),
)
const { busy, error, submit } = useFormSubmission()
const { dirty } = useUnsavedChanges()
const confirming = ref(false)
const resolver = computed(() => zodResolver(areaFieldsSchema()))
const initial = computed(() => ({ code: area.value?.code ?? '', name: area.value?.name ?? '' }))
const canManage = computed(() => context.can('areas.manage'))
watch([id, () => context.activeContextId], () => {
  error.value = null
  dirty.value = false
  confirming.value = false
  confirm.close()
})
onBeforeUnmount(() => confirm.close())

async function complete(summary: string) {
  dirty.value = false
  await queryClient.cancelQueries({ queryKey: ['community'] })
  queryClient.removeQueries({ queryKey: ['community'] })
  await router.replace('/manage/areas')
  toast.add({ severity: 'success', summary, life: 5000 })
}

async function save(event: FormSubmitEvent) {
  if (!event.valid || !canManage.value || !query.isSuccess.value || confirming.value) return
  const payload = updateAreaPayload(event.values)
  await submit(
    true,
    payload,
    (headers) => updateArea(id.value, payload, { headers }),
    () => complete(tr('Wilayah diperbarui')),
  )
}

function requestDelete() {
  if (busy.value || confirming.value || !canManage.value || !area.value?.public_id) return
  const areaId = id.value
  const activeContext = context.activeContextId
  confirming.value = true
  confirm.require({
    header: tr('Hapus wilayah?'),
    message: `${area.value.name ?? ''} (${area.value.code ?? ''}). ${tr('Wilayah yang masih digunakan tidak dapat dihapus. Penghapusan tidak dapat dibatalkan.')}${dirty.value ? ' ' + tr('Perubahan formulir yang belum disimpan akan dibuang jika penghapusan berhasil.') : ''}`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: tr('Ya, hapus wilayah'),
    rejectLabel: tr('Batal'),
    acceptProps: { severity: 'danger' },
    rejectProps: { severity: 'secondary', outlined: true },
    onHide: () => {
      confirming.value = false
    },
    reject: () => {
      confirming.value = false
    },
    accept: async () => {
      confirming.value = false
      if (areaId !== id.value || activeContext !== context.activeContextId || !canManage.value)
        return
      await submit(
        true,
        { area: areaId },
        (headers) => deleteArea(areaId, { headers }),
        () => complete(tr('Wilayah dihapus')),
      )
    },
  })
}
</script>
<template>
  <section class="page-container">
    <RouterLink to="/manage/areas" class="back-link"
      ><i class="pi pi-arrow-left" aria-hidden="true" />{{
        tr('Kembali ke daftar wilayah')
      }}</RouterLink
    >
    <PageHeader
      :eyebrow="tr('DATA LINGKUNGAN')"
      :title="tr('Detail wilayah')"
      :description="tr('Tinjau informasi RT/RW dan perbarui kode atau namanya.')"
    />
    <AppSkeleton v-if="query.isPending.value" />
    <ErrorState
      v-else-if="query.isError.value"
      :description="normalizeApiError(query.error.value).message"
      @retry="query.refetch()"
    />
    <template v-else-if="area">
      <div class="form-note mb-6">
        <h3>{{ area.name }}</h3>
        <Tag
          :value="area.kind === 'rw' ? tr('Rukun Warga') : tr('Rukun Tetangga')"
          severity="info"
        />
        <p v-if="area.kind === 'rt'">
          {{ tr('RW induk') }}: {{ parentId ? parentLabel : tr('RW induk tidak tersedia') }}
        </p>
        <Button
          v-if="parentId && parentQuery.isError.value"
          :label="tr('Muat ulang RW induk')"
          text
          @click="parentQuery.refetch()"
        />
        <p>{{ tr('Jenis wilayah dan RW induk tidak dapat diubah.') }}</p>
      </div>
      <Form
        v-slot="$form"
        :key="id + String(query.dataUpdatedAt.value)"
        :initial-values="initial"
        :resolver="resolver"
        class="form-panel"
        @submit="save"
        @input="dirty = canManage"
        @change="dirty = canManage"
      >
        <div class="form-panel-heading">
          <div>
            <h3>{{ tr('Informasi wilayah') }}</h3>
            <p>{{ tr('Kolom bertanda * wajib diisi.') }}</p>
          </div>
        </div>
        <MutationErrors :error="error" />
        <fieldset :disabled="!canManage || busy || confirming" class="form-fields">
          <div class="form-field">
            <label for="area-code">{{ tr('Kode') }} <span class="required">*</span></label
            ><InputText
              id="area-code"
              name="code"
              :maxlength="20"
              :invalid="!!$form.code?.invalid"
            /><small class="text-red-700">{{ $form.code?.error?.message }}</small>
          </div>
          <div class="form-field">
            <label for="area-name">{{ tr('Nama wilayah') }} <span class="required">*</span></label
            ><InputText
              id="area-name"
              name="name"
              :maxlength="100"
              :invalid="!!$form.name?.invalid"
            /><small class="text-red-700">{{ $form.name?.error?.message }}</small>
          </div>
        </fieldset>
        <div v-if="canManage" class="form-actions">
          <Button
            type="submit"
            :label="tr('Simpan perubahan')"
            icon="pi pi-check"
            :loading="busy"
            :disabled="confirming || busy"
          />
        </div>
      </Form>
      <div v-if="canManage" class="form-panel mt-6">
        <div class="form-panel-heading">
          <div>
            <h3>{{ tr('Hapus wilayah') }}</h3>
            <p>
              {{
                tr(
                  'Wilayah yang masih digunakan tidak dapat dihapus. Penghapusan tidak dapat dibatalkan.',
                )
              }}
            </p>
          </div>
        </div>
        <Message v-if="dirty" severity="warn" :closable="false">{{
          tr('Perubahan formulir yang belum disimpan akan dibuang jika penghapusan berhasil.')
        }}</Message>
        <div class="form-actions">
          <Button
            :label="tr('Hapus wilayah')"
            icon="pi pi-trash"
            severity="danger"
            outlined
            :disabled="busy || confirming"
            @click="requestDelete"
          />
        </div>
      </div>
    </template>
  </section>
</template>
