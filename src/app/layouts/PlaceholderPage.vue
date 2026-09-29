<template>
  <section class="placeholder-page">
    <span class="placeholder-icon"><i class="pi pi-sparkles" aria-hidden="true" /></span
    ><span class="eyebrow">SEGERA HADIR</span>
    <h1>{{ $route.meta.title ?? 'Halaman baru' }}</h1>
    <p>
      Ruang ini sedang disiapkan.<br />Sementara itu, Anda dapat kembali ke akses yang tersedia.
    </p>
    <RouterLink to="/auth/select-context" class="hero-action"
      >Pilih akses <i class="pi pi-arrow-right" aria-hidden="true"
    /></RouterLink>
  </section>
</template>
