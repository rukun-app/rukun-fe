<script setup lang="ts">
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { apiChangePassword } from '@/auth/api/auth'
import { ensureSession, hydrationError } from '@/auth/services/authentication'
import { normalizeApiError, isApiError } from '@/api/errors/normalizer'
import type { NormalizedApiError } from '@/api/errors/types'

const router = useRouter()

const form = ref({ current_password: '', password: '', password_confirmation: '' })
const loading = ref(false)
const error = ref<NormalizedApiError | null>(null)
const showNew = ref(false)
const showConfirm = ref(false)

const mismatch = computed(
  () =>
    form.value.password_confirmation.length > 0 &&
    form.value.password !== form.value.password_confirmation,
)

const canSubmit = computed(
  () =>
    form.value.current_password.length > 0 &&
    form.value.password.length >= 8 &&
    form.value.password_confirmation.length > 0 &&
    !mismatch.value,
)

async function submit() {
  if (loading.value || !canSubmit.value) return
  loading.value = true
  error.value = null
  try {
    await apiChangePassword({
      current_password: form.value.current_password,
      password: form.value.password,
      password_confirmation: form.value.password_confirmation,
    })
    await ensureSession(true)
    await router.replace(hydrationError.value ? '/auth/session-error' : '/')
  } catch (e) {
    error.value = isApiError(e)
      ? normalizeApiError(e)
      : {
          code: 'UNKNOWN_ERROR',
          message: 'Terjadi kesalahan. Silakan coba lagi.',
          fieldErrors: {},
          requestId: null,
          httpStatus: 0,
        }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-sm mx-auto px-4">
    <div class="mb-8 text-center">
      <div
        class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 mb-3"
      >
        <i class="pi pi-lock text-primary-600 dark:text-primary-400 text-xl" />
      </div>
      <h1 class="text-xl font-bold text-surface-900 dark:text-surface-0">Buat Kata Sandi Baru</h1>
      <p class="text-surface-500 mt-1 text-sm">
        Akun Anda menggunakan kata sandi sementara. Buat kata sandi baru untuk melanjutkan.
      </p>
    </div>

    <form class="space-y-4" novalidate @submit.prevent="submit">
      <div
        v-if="error"
        role="alert"
        class="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300"
      >
        {{ error.message }}
      </div>

      <!-- Current password -->
      <div class="flex flex-col gap-1">
        <label
          for="current_password"
          class="text-sm font-medium text-surface-700 dark:text-surface-200"
        >
          Kata Sandi Sementara
        </label>
        <InputText
          id="current_password"
          v-model="form.current_password"
          type="password"
          autocomplete="current-password"
          placeholder="••••••••"
          :invalid="!!error?.fieldErrors['current_password']"
          :disabled="loading"
          class="w-full"
        />
        <small v-if="error?.fieldErrors['current_password']" class="text-red-600 dark:text-red-400">
          {{ error.fieldErrors['current_password']![0] }}
        </small>
      </div>

      <!-- New password -->
      <div class="flex flex-col gap-1">
        <label for="password" class="text-sm font-medium text-surface-700 dark:text-surface-200">
          Kata Sandi Baru
        </label>
        <div class="relative">
          <InputText
            id="password"
            v-model="form.password"
            :type="showNew ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="Minimal 8 karakter"
            :invalid="!!error?.fieldErrors['password']"
            :disabled="loading"
            class="w-full pr-10"
          />
          <button
            type="button"
            :aria-label="showNew ? 'Sembunyikan' : 'Tampilkan'"
            :aria-pressed="showNew"
            class="absolute inset-y-0 right-3 flex items-center text-surface-400 hover:text-surface-600 focus-visible:outline-none"
            @click="showNew = !showNew"
          >
            <i :class="showNew ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-sm" />
          </button>
        </div>
        <small v-if="error?.fieldErrors['password']" class="text-red-600 dark:text-red-400">
          {{ error.fieldErrors['password']![0] }}
        </small>
      </div>

      <!-- Confirm password -->
      <div class="flex flex-col gap-1">
        <label
          for="password_confirmation"
          class="text-sm font-medium text-surface-700 dark:text-surface-200"
        >
          Konfirmasi Kata Sandi Baru
        </label>
        <div class="relative">
          <InputText
            id="password_confirmation"
            v-model="form.password_confirmation"
            :type="showConfirm ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="••••••••"
            :invalid="mismatch"
            :disabled="loading"
            class="w-full pr-10"
          />
          <button
            type="button"
            :aria-label="showConfirm ? 'Sembunyikan' : 'Tampilkan'"
            :aria-pressed="showConfirm"
            class="absolute inset-y-0 right-3 flex items-center text-surface-400 hover:text-surface-600 focus-visible:outline-none"
            @click="showConfirm = !showConfirm"
          >
            <i :class="showConfirm ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-sm" />
          </button>
        </div>
        <small v-if="mismatch" class="text-red-600 dark:text-red-400">Kata sandi tidak cocok</small>
      </div>

      <Button
        type="submit"
        label="Simpan Kata Sandi"
        :loading="loading"
        :disabled="!canSubmit"
        class="w-full"
      />
    </form>
  </div>
</template>
