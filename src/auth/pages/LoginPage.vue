<script setup lang="ts">
import { usePasswordPassThrough } from '@/shared/composables/usePasswordPassThrough'
const passwordPassThrough = usePasswordPassThrough()
import { tr } from '@/i18n'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Password from 'primevue/password'
import { ref, computed } from 'vue'
import { useAuth } from '@/auth/composables/useAuth'
import type { LoginRequest } from '@/auth/api/types'

const { loading, error, login } = useAuth()

const form = ref<LoginRequest>({ identifier: '', password: '', device_name: 'web' })

const fieldError = computed(() => error.value?.fieldErrors ?? {})

async function submit() {
  await login(form.value)
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-page-heading">
      <span class="eyebrow"> {{ tr('SELAMAT DATANG DI RUKUN') }} </span>
      <h1>
        {{ tr('Senang bertemu') }} <br />
        {{ tr('Anda kembali.') }}
      </h1>
      <p>
        {{ tr('Masuk untuk mengelola dan terhubung') }} <br />
        {{ tr('dengan lingkungan Anda.') }}
      </p>
    </div>

    <form class="auth-form" novalidate @submit.prevent="submit">
      <!-- Global error -->
      <div
        v-if="error && !error.fieldErrors['identifier'] && !error.fieldErrors['password']"
        role="alert"
        class="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300"
      >
        {{ error.message }}
      </div>

      <!-- Identifier -->
      <div class="flex flex-col gap-1">
        <label for="identifier" class="text-sm font-medium text-surface-700 dark:text-surface-200">
          {{ tr('Email / Nomor HP') }}
        </label>
        <InputText
          id="identifier"
          v-model="form.identifier"
          autocomplete="username"
          inputmode="email"
          :placeholder="tr('email@contoh.com atau 08xx')"
          :invalid="!!fieldError['identifier']"
          :disabled="loading"
          class="w-full"
        />
        <small v-if="fieldError['identifier']" class="text-red-600 dark:text-red-400">
          {{ fieldError['identifier']![0] }}
        </small>
      </div>

      <!-- Password -->
      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between">
          <label for="password" class="text-sm font-medium text-surface-700 dark:text-surface-200">
            {{ tr('Kata Sandi') }}
          </label>
          <RouterLink
            to="/auth/forgot-password"
            class="text-xs text-primary-600 dark:text-primary-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
          >
            {{ tr('Lupa kata sandi?') }}
          </RouterLink>
        </div>
        <Password
          :pt="passwordPassThrough"
          :feedback="false"
          toggle-mask
          fluid
          input-id="password"
          v-model="form.password"
          :input-props="{ autocomplete: 'current-password' }"
          :placeholder="tr('••••••••')"
          :invalid="!!fieldError['password']"
          :disabled="loading"
          class="w-full"
        />
        <small v-if="fieldError['password']" class="text-red-600 dark:text-red-400">
          {{ fieldError['password']![0] }}
        </small>
      </div>

      <Button
        type="submit"
        :label="tr('Masuk')"
        icon="pi pi-arrow-right"
        icon-pos="right"
        :loading="loading"
        :disabled="!form.identifier || !form.password"
        class="w-full"
      />
    </form>
    <p class="auth-help">
      <i class="pi pi-info-circle" aria-hidden="true" />
      {{ tr('Belum punya akun? Hubungi pengurus RT/RW Anda.') }}
    </p>
  </div>
</template>
