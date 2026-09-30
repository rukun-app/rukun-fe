<script setup lang="ts">
import { tr } from '@/i18n'
</script>
<template>
  <section class="placeholder-page">
    <span class="placeholder-icon"><i class="pi pi-sparkles" aria-hidden="true" /></span
    ><span class="eyebrow"> {{ tr('SEGERA HADIR') }} </span>
    <h1>{{ tr(String($route.meta.title ?? 'Halaman baru')) }}</h1>
    <p>
      {{ tr('Ruang ini sedang disiapkan.') }} <br />
      {{ tr('Sementara itu, Anda dapat kembali ke akses yang tersedia.') }}
    </p>
    <RouterLink to="/auth/select-context" class="hero-action">
      {{ tr('Pilih akses') }} <i class="pi pi-arrow-right" aria-hidden="true"
    /></RouterLink>
  </section>
</template>
