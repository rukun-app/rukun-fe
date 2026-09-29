<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuth } from '@/auth/composables/useAuth'
import type { LoginRequest } from '@/auth/api/types'

const { loading, error, login } = useAuth()

const form = ref<LoginRequest>({ identifier: '', password: '', device_name: 'web' })
const showPassword = ref(false)

const fieldError = computed(() => error.value?.fieldErrors ?? {})

async function submit() {
  await login(form.value)
}
</script>

<template>
  <div class="w-full max-w-sm mx-auto px-4">
    <div class="mb-8 text-center">
      <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Rukun</h1>
      <p class="text-surface-500 mt-1 text-sm">Masuk ke akun Anda</p>
    </div>

    <form class="space-y-4" novalidate @submit.prevent="submit">
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
          Email / Nomor HP
        </label>
        <InputText
          id="identifier"
          v-model="form.identifier"
          autocomplete="username"
          inputmode="email"
          placeholder="email@contoh.com atau 08xx"
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
            Kata Sandi
          </label>
          <RouterLink
            to="/auth/forgot-password"
            class="text-xs text-primary-600 dark:text-primary-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
          >
            Lupa kata sandi?
          </RouterLink>
        </div>
        <div class="relative">
          <InputText
            id="password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            placeholder="••••••••"
            :invalid="!!fieldError['password']"
            :disabled="loading"
            class="w-full pr-10"
          />
          <button
            type="button"
            :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
            :aria-pressed="showPassword"
            class="absolute inset-y-0 right-3 flex items-center text-surface-400 hover:text-surface-600 focus-visible:outline-none"
            @click="showPassword = !showPassword"
          >
            <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" class="text-sm" />
          </button>
        </div>
        <small v-if="fieldError['password']" class="text-red-600 dark:text-red-400">
          {{ fieldError['password']![0] }}
        </small>
      </div>

      <Button
        type="submit"
        label="Masuk"
        :loading="loading"
        :disabled="!form.identifier || !form.password"
        class="w-full"
      />
    </form>
  </div>
</template>
