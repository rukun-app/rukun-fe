<script setup lang="ts">
import { tr } from '@/i18n'
</script>
<template>
  <section class="p-6 space-y-4">
    <h1 class="text-xl font-semibold">{{ tr('Akses tidak tersedia') }}</h1>
    <p>{{ tr('Anda tidak memiliki izin untuk membuka halaman ini pada akses yang dipilih.') }}</p>
    <RouterLink to="/auth/select-context" class="text-primary-700 underline">
      {{ tr('Pilih akses lain') }}
    </RouterLink>
  </section>
</template>
