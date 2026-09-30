<script setup lang="ts">
import { tr } from '@/i18n'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import { ensureSession, hydrationError, clearAuthentication } from '@/auth/services/authentication'
const router = useRouter()
const loading = ref(false)
async function retry() {
  loading.value = true
  await ensureSession(true)
  loading.value = false
  if (!hydrationError.value) await router.replace('/')
}
function exit() {
  clearAuthentication()
  void router.replace('/auth/login')
}
</script>
<template>
  <section class="max-w-md space-y-4" role="alert">
    <h1 class="text-xl font-semibold">{{ tr('Sesi belum dapat dimuat') }}</h1>
    <p>{{ hydrationError?.message || 'Periksa koneksi Anda, lalu coba lagi.' }}</p>
    <p v-if="hydrationError?.requestId">{{ tr('ID bantuan:') }} {{ hydrationError.requestId }}</p>
    <Button :label="tr('Coba lagi')" :loading="loading" @click="retry" />
    <Button :label="tr('Kembali ke login')" severity="secondary" @click="exit" />
  </section>
</template>
