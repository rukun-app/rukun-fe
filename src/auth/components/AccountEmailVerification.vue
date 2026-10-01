<script setup lang="ts">
import { computed, onBeforeUnmount, shallowRef, ref, watch } from 'vue'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import { currentUser, resendVerification } from '@/api/generated/endpoints'
import type { UserProfile } from '@/api/generated/models'
import { MutationErrors } from '@/design-system'
import { session } from '@/auth/stores/session'
import { useFormSubmission } from '@/shared/composables/useFormSubmission'
import { formatDateTime } from '@/shared/utils/dateTime'
import { emailVerificationState, verificationEmailPayload } from '@/auth/forms/emailVerification'
import { tr } from '@/i18n'
const props = defineProps<{ user: UserProfile; disabled: boolean }>()
const emit = defineEmits<{ busy: [value: boolean] }>()
const refreshed = shallowRef<UserProfile>()
const user = computed(() => refreshed.value ?? props.user)
const state = computed(() => emailVerificationState(user.value))
const statusLabel = computed(() =>
  tr(
    {
      no_email: 'Belum memiliki email',
      unknown: 'Status verifikasi belum tersedia',
      unverified: 'Email belum terverifikasi',
      verified: 'Email terverifikasi',
    }[state.value],
  ),
)
const { busy, error, submit } = useFormSubmission()
const sent = ref(false)
const checked = ref(false)
const operation = ref<'send' | 'check'>()
const controller = new AbortController()
let active = true
watch(busy, (value) => emit('busy', value), { flush: 'sync' })
watch(
  () => [props.user.id, props.user.email, props.user.email_verified_at],
  () => {
    refreshed.value = undefined
    sent.value = false
    checked.value = false
    error.value = null
  },
)
onBeforeUnmount(() => {
  active = false
  controller.abort()
  emit('busy', false)
})
function isCurrent(token: string | null, id: number) {
  return active && token === session.getToken() && props.user.id === id
}
async function send() {
  const payload = verificationEmailPayload(user.value)
  if (!payload || props.disabled || busy.value) return
  const token = session.getToken()
  const id = user.value.id
  operation.value = 'send'
  sent.value = false
  checked.value = false
  await submit(
    true,
    payload,
    () => resendVerification(payload, { signal: controller.signal }),
    () => {
      if (isCurrent(token, id)) sent.value = true
    },
  )
}
async function check() {
  if (props.disabled || busy.value) return
  const token = session.getToken()
  const id = user.value.id
  operation.value = 'check'
  checked.value = false
  await submit(true, { action: 'check-email' }, async () => {
    const response = await currentUser(undefined, controller.signal)
    if (!isCurrent(token, id)) return
    if (response.data.id !== id) throw new Error('Unexpected account')
    refreshed.value = response.data
    checked.value = true
    if (state.value === 'verified') sent.value = false
  })
}
</script>
<template>
  <section class="mb-8" :aria-label="tr('Verifikasi email')">
    <h2 class="font-semibold mb-2">{{ tr('Verifikasi email') }}</h2>
    <p class="text-sm mb-2 break-all">{{ user.email || '—' }}</p>
    <Tag
      :severity="state === 'verified' ? 'success' : state === 'unverified' ? 'warn' : 'secondary'"
      :value="statusLabel"
    />
    <p v-if="state === 'verified'" class="text-sm text-surface-500 mt-2">
      {{ tr('Terverifikasi pada') }}: {{ formatDateTime(user.email_verified_at) }}
    </p>
    <p v-else-if="state === 'no_email'" class="text-sm text-surface-500 mt-2">
      {{ tr('Akun ini belum memiliki email. Hubungi pengurus untuk bantuan data akun.') }}
    </p>
    <p v-else class="text-sm text-surface-500 mt-2">
      {{ tr('Buka tautan verifikasi dari email, lalu kembali ke halaman ini dan periksa status.') }}
    </p>
    <div class="my-3"><MutationErrors :error="error" /></div>
    <Message v-if="sent" severity="info" :closable="false" class="my-3">{{
      tr(
        'Permintaan kirim ulang diterima. Periksa kotak masuk atau spam. Status email belum berubah.',
      )
    }}</Message>
    <Message
      v-if="checked && state === 'unverified'"
      severity="info"
      :closable="false"
      class="my-3"
      >{{
        tr(
          'Server masih menandai email belum terverifikasi. Jika tautan kedaluwarsa, minta kirim ulang.',
        )
      }}</Message
    >
    <div class="flex flex-wrap gap-2 mt-4">
      <Button
        v-if="state === 'unverified'"
        :label="tr('Kirim ulang email verifikasi')"
        icon="pi pi-envelope"
        :loading="busy && operation === 'send'"
        :disabled="disabled || busy"
        @click="send"
      />
      <Button
        :label="tr('Periksa status email')"
        icon="pi pi-refresh"
        severity="secondary"
        outlined
        :loading="busy && operation === 'check'"
        :disabled="disabled || busy"
        @click="check"
      />
    </div>
  </section>
</template>
