<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Form, type FormSubmitEvent } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Message from 'primevue/message'
import { tr } from '@/i18n'
import { MutationErrors } from '@/design-system'
import { resetPassword } from '@/api/generated/endpoints'
import { clearAuthentication } from '@/auth/services/authentication'
import { useFormSubmission } from '@/shared/composables/useFormSubmission'
import { usePasswordPassThrough } from '@/shared/composables/usePasswordPassThrough'
import {
  readResetLink,
  resetPasswordFieldsSchema,
  resetPasswordPayload,
} from '@/auth/forms/resetPassword'

const route = useRoute()
const router = useRouter()
const link = computed(() => readResetLink(route.query))
const completed = ref(false)
const { busy, error, submit } = useFormSubmission()
const passwordPassThrough = usePasswordPassThrough()
const resolver = computed(() => zodResolver(resetPasswordFieldsSchema()))
let active = true
let request: AbortController | undefined
watch(
  () => route.fullPath,
  () => {
    request?.abort()
    error.value = null
    if (link.value) completed.value = false
  },
)
onBeforeUnmount(() => {
  active = false
  request?.abort()
})

async function save(event: FormSubmitEvent) {
  if (!event.valid || !link.value || busy.value) return
  const requestPath = route.fullPath
  const payload = resetPasswordPayload(route.query, event.values)
  request = new AbortController()
  await submit(
    true,
    payload,
    () => resetPassword(payload, { signal: request?.signal }),
    async () => {
      if (!active || route.fullPath !== requestPath) return
      clearAuthentication()
      completed.value = true
      // Unmount password fields and remove the reset credentials from the current URL.
      await router.replace({ name: 'auth.reset-password', query: {} })
    },
  )
  if (route.fullPath !== requestPath && !completed.value) error.value = null
}
</script>
<template>
  <div class="auth-page">
    <div class="auth-page-heading">
      <h1 class="text-xl font-bold text-surface-900 dark:text-surface-0">
        {{ tr('Reset Kata Sandi') }}
      </h1>
      <p class="text-surface-500 mt-1 text-sm">
        {{ tr('Buat kata sandi baru untuk akun pada tautan email Anda.') }}
      </p>
    </div>
    <Message v-if="completed" severity="success" :closable="false">
      {{ tr('Kata sandi berhasil direset. Silakan masuk kembali dengan kata sandi baru.') }}
    </Message>
    <Message v-else-if="!link" severity="warn" :closable="false">
      {{ tr('Tautan reset tidak lengkap atau tidak valid. Minta tautan baru melalui email.') }}
    </Message>
    <Form
      v-else
      v-slot="$form"
      :key="route.fullPath"
      :initial-values="{ password: '', password_confirmation: '' }"
      :resolver="resolver"
      class="auth-form"
      @submit="save"
    >
      <MutationErrors :error="error" />
      <div class="flex flex-col gap-1">
        <label for="reset-email">{{ tr('Email') }}</label>
        <InputText id="reset-email" :model-value="link.email" readonly autocomplete="username" />
      </div>
      <div class="flex flex-col gap-1">
        <label for="reset-password">{{ tr('Kata Sandi Baru') }}</label>
        <Password
          name="password"
          input-id="reset-password"
          :pt="passwordPassThrough"
          :feedback="false"
          toggle-mask
          fluid
          :input-props="{
            autocomplete: 'new-password',
            'aria-describedby': 'reset-password-help reset-password-error',
          }"
          :disabled="busy"
          :invalid="!!$form.password?.invalid"
        />
        <small id="reset-password-help" class="text-surface-500">{{
          tr('Kata sandi minimal 12 karakter')
        }}</small>
        <small id="reset-password-error" class="text-red-700 dark:text-red-400">{{
          $form.password?.error?.message
        }}</small>
      </div>
      <div class="flex flex-col gap-1">
        <label for="reset-confirmation">{{ tr('Konfirmasi Kata Sandi Baru') }}</label>
        <Password
          name="password_confirmation"
          input-id="reset-confirmation"
          :pt="passwordPassThrough"
          :feedback="false"
          toggle-mask
          fluid
          :input-props="{
            autocomplete: 'new-password',
            'aria-describedby': 'reset-confirmation-error',
          }"
          :disabled="busy"
          :invalid="!!$form.password_confirmation?.invalid"
        />
        <small id="reset-confirmation-error" class="text-red-700 dark:text-red-400">{{
          $form.password_confirmation?.error?.message
        }}</small>
      </div>
      <Button
        type="submit"
        :label="tr('Simpan Kata Sandi')"
        :loading="busy"
        :disabled="busy"
        class="w-full"
      />
    </Form>
    <div class="mt-6 flex flex-wrap gap-4 text-sm">
      <RouterLink
        v-if="!completed"
        to="/auth/forgot-password"
        class="font-semibold text-primary-700 dark:text-primary-300"
        >{{ tr('Minta tautan reset baru') }}</RouterLink
      >
      <RouterLink to="/auth/login" class="font-semibold text-primary-700 dark:text-primary-300">{{
        tr('Kembali ke halaman masuk')
      }}</RouterLink>
    </div>
  </div>
</template>
