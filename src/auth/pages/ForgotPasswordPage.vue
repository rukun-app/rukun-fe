<script setup lang="ts">
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { ref } from 'vue'
import { apiForgotPassword } from '@/auth/api/auth'
import { normalizeApiError, isApiError } from '@/api/errors/normalizer'
import type { NormalizedApiError } from '@/api/errors/types'

const identifier = ref('')
const loading = ref(false)
const error = ref<NormalizedApiError | null>(null)
const sent = ref(false)

async function submit() {
  if (loading.value) return
  loading.value = true
  error.value = null
  try {
    await apiForgotPassword({ email: identifier.value })
    sent.value = true
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
  <div class="auth-page">
    <div class="auth-page-heading">
      <RouterLink
        to="/auth/login"
        class="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
      >
        <i class="pi pi-arrow-left text-xs" />
        Kembali
      </RouterLink>
      <h1 class="text-xl font-bold text-surface-900 dark:text-surface-0">Lupa Kata Sandi</h1>
      <p class="text-surface-500 mt-1 text-sm">
        Masukkan email Anda untuk meminta tautan reset. Jika akun hanya memakai nomor HP, hubungi
        pengurus.
      </p>
    </div>

    <div
      v-if="sent"
      role="status"
      class="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-300"
    >
      Jika email terdaftar, instruksi reset akan dikirim ke email tersebut.
    </div>

    <form v-else class="auth-form" novalidate @submit.prevent="submit">
      <div
        v-if="error"
        role="alert"
        class="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300"
      >
        {{ error.message }}
      </div>

      <div class="flex flex-col gap-1">
        <label for="identifier" class="text-sm font-medium text-surface-700 dark:text-surface-200">
          Email
        </label>
        <InputText
          id="identifier"
          v-model="identifier"
          autocomplete="username"
          inputmode="email"
          type="email"
          placeholder="email@contoh.com"
          :disabled="loading"
          class="w-full"
        />
      </div>

      <Button
        type="submit"
        label="Kirim Instruksi"
        :loading="loading"
        :disabled="!identifier"
        class="w-full"
      />
    </form>
  </div>
</template>
