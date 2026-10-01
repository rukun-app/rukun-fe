<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AccountSessions from '@/auth/components/AccountSessions.vue'
import { useQuery } from '@tanstack/vue-query'
import { Form, type FormSubmitEvent } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Password from 'primevue/password'
import Message from 'primevue/message'
import { currentUser, updateProfile, changePassword } from '@/api/generated/endpoints'
import { session } from '@/auth/stores/session'
import { applyProfile } from '@/auth/services/authentication'
import { queryClient } from '@/app/providers/query'
import { useFormSubmission } from '@/shared/composables/useFormSubmission'
import { useUnsavedChanges } from '@/shared/composables/useUnsavedChanges'
import { usePasswordPassThrough } from '@/shared/composables/usePasswordPassThrough'
import { AppSkeleton, ErrorState, MutationErrors } from '@/design-system'
import { normalizeApiError } from '@/api/errors/normalizer'
import { i18n, setLocale, tr } from '@/i18n'
import {
  profileSchema,
  profilePayload,
  accountPasswordSchema,
  accountPasswordPayload,
} from '@/auth/forms/account'

const key = ['account', session.getUser()?.id, 'profile']
const query = useQuery({
  queryKey: key,
  queryFn: ({ signal }) => currentUser(undefined, signal),
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
})
const user = computed(() => query.data.value?.data)
const initial = computed(() => ({
  name: user.value?.name ?? '',
  locale: user.value?.locale ?? i18n.global.locale.value,
}))
const profile = useFormSubmission()
const password = useFormSubmission()
const profileDirty = ref(false)
const passwordDirty = ref(false)
const { dirty } = useUnsavedChanges()
watch(
  [profileDirty, passwordDirty],
  () => {
    dirty.value = profileDirty.value || passwordDirty.value
  },
  { flush: 'sync' },
)
const profileSaved = ref(false)
const passwordSaved = ref(false)
const passwordRevision = ref(0)
const passwordPassThrough = usePasswordPassThrough()
const profileResolver = computed(() => zodResolver(profileSchema()))
const passwordResolver = computed(() => zodResolver(accountPasswordSchema()))
const sessionsBusy = ref(false)
const busy = computed(() => profile.busy.value || password.busy.value || sessionsBusy.value)
function signedOut() {
  profileDirty.value = false
  passwordDirty.value = false
}
const passwordFields = [
  { name: 'current_password', label: 'Kata Sandi Saat Ini', autocomplete: 'current-password' },
  { name: 'password', label: 'Kata Sandi Baru', autocomplete: 'new-password' },
  {
    name: 'password_confirmation',
    label: 'Konfirmasi Kata Sandi Baru',
    autocomplete: 'new-password',
  },
] as const
function editProfile() {
  profileDirty.value = true
  profileSaved.value = false
}
function editPassword() {
  passwordDirty.value = true
  passwordSaved.value = false
}
async function saveProfile(event: FormSubmitEvent) {
  if (!event.valid || busy.value) return
  profileSaved.value = false
  const payload = profilePayload(event.values)
  const token = session.getToken()
  await profile.submit(true, payload, async () => {
    const response = await updateProfile(payload)
    if (session.getToken() !== token) return
    queryClient.setQueryData(key, response)
    setLocale(response.data.locale ?? payload.locale ?? 'id')
    applyProfile(response.data)
    profileDirty.value = false
    profileSaved.value = true
  })
}
async function savePassword(event: FormSubmitEvent) {
  if (!event.valid || busy.value) return
  passwordSaved.value = false
  const payload = accountPasswordPayload(event.values)
  const token = session.getToken()
  await password.submit(true, payload, async () => {
    await changePassword(payload)
    if (session.getToken() !== token) return
    passwordDirty.value = false
    passwordRevision.value++
    passwordSaved.value = true
    await queryClient.invalidateQueries({
      queryKey: ['account', session.getUser()?.id, 'sessions'],
    })
  })
}
</script>
<template>
  <div class="auth-page">
    <RouterLink to="/" class="back-link"
      ><i class="pi pi-arrow-left" aria-hidden="true" />{{ tr('Kembali ke aplikasi') }}</RouterLink
    >
    <div class="auth-page-heading">
      <h1 class="text-xl font-bold text-surface-900 dark:text-surface-0">{{ tr('Akun saya') }}</h1>
      <p class="text-surface-500 mt-1 text-sm">
        {{ tr('Kelola nama, bahasa akun, dan kata sandi Anda.') }}
      </p>
    </div>
    <AppSkeleton v-if="query.isPending.value" />
    <ErrorState
      v-else-if="query.isError.value"
      :description="normalizeApiError(query.error.value).message"
      @retry="query.refetch()"
    />
    <template v-else-if="user">
      <dl class="mb-6 text-sm space-y-2">
        <div>
          <dt>{{ tr('Email') }}</dt>
          <dd>{{ user.email || '—' }}</dd>
        </div>
        <div>
          <dt>{{ tr('Nomor HP') }}</dt>
          <dd>{{ user.phone || '—' }}</dd>
        </div>
      </dl>
      <Message v-if="profileSaved" severity="success" :closable="false" class="mb-4">{{
        tr('Profil tersimpan')
      }}</Message>
      <Form
        v-slot="$form"
        :key="query.dataUpdatedAt.value"
        :initial-values="initial"
        :resolver="profileResolver"
        class="auth-form"
        @submit="saveProfile"
        @input="editProfile"
        @change="editProfile"
      >
        <h2 class="font-semibold">{{ tr('Profil akun') }}</h2>
        <MutationErrors :error="profile.error.value" />
        <div class="flex flex-col gap-1">
          <label for="account-name">{{ tr('Nama lengkap') }}</label
          ><InputText
            id="account-name"
            name="name"
            :maxlength="100"
            :disabled="busy"
            :invalid="!!$form.name?.invalid"
          /><small class="text-red-700 dark:text-red-400">{{ $form.name?.error?.message }}</small>
        </div>
        <div class="flex flex-col gap-1">
          <label for="account-locale">{{ tr('Bahasa akun') }}</label
          ><Select
            input-id="account-locale"
            name="locale"
            :aria-label="tr('Bahasa akun')"
            :options="[
              { value: 'id', label: 'Bahasa Indonesia' },
              { value: 'en', label: 'English' },
            ]"
            option-label="label"
            option-value="value"
            :disabled="busy"
            @change="editProfile"
          /><small class="text-surface-500">{{
            tr(
              'Simpan profil untuk menerapkan bahasa akun. Pilihan bahasa di perangkat ini diutamakan saat masuk.',
            )
          }}</small>
        </div>
        <Button
          type="submit"
          :label="tr('Simpan profil')"
          :loading="profile.busy.value"
          :disabled="busy"
        />
      </Form>
      <div class="my-8 border-t border-surface-200 dark:border-surface-700" />
      <Message v-if="passwordSaved" severity="success" :closable="false" class="mb-4">{{
        tr('Kata sandi diperbarui. Sesi perangkat lain telah dicabut oleh server.')
      }}</Message>
      <Form
        v-slot="$form"
        :key="passwordRevision"
        :initial-values="{ current_password: '', password: '', password_confirmation: '' }"
        :resolver="passwordResolver"
        class="auth-form"
        @submit="savePassword"
        @input="editPassword"
      >
        <h2 class="font-semibold">{{ tr('Ganti kata sandi') }}</h2>
        <p class="text-sm text-surface-500">
          {{
            tr(
              'Minimal 8 karakter. Sesi perangkat ini tetap aktif; sesi lain dicabut setelah berhasil.',
            )
          }}
        </p>
        <MutationErrors :error="password.error.value" />
        <div v-for="field in passwordFields" :key="field.name" class="flex flex-col gap-1">
          <label :for="`account-${field.name}`">{{ tr(field.label) }}</label
          ><Password
            :input-id="`account-${field.name}`"
            :name="field.name"
            :pt="passwordPassThrough"
            :feedback="false"
            toggle-mask
            fluid
            :input-props="{ autocomplete: field.autocomplete }"
            :disabled="busy"
            :invalid="!!$form[field.name]?.invalid"
          /><small class="text-red-700 dark:text-red-400">{{
            $form[field.name]?.error?.message
          }}</small>
        </div>
        <Button
          type="submit"
          :label="tr('Simpan Kata Sandi')"
          :loading="password.busy.value"
          :disabled="busy"
        />
      </Form>
      <AccountSessions
        :disabled="profile.busy.value || password.busy.value"
        :has-unsaved-changes="dirty"
        @busy="sessionsBusy = $event"
        @signed-out="signedOut"
      />
    </template>
  </div>
</template>
