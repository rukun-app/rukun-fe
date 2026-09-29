<script setup lang="ts">
import BrandMark from '@/app/components/BrandMark.vue'
import NeighborhoodArt from '@/app/components/NeighborhoodArt.vue'
</script>
<template>
  <div class="auth-layout">
    <aside class="auth-story">
      <BrandMark light />
      <div class="auth-story-copy">
        <span class="eyebrow">RUANG UNTUK BERTETANGGA</span>
        <h2>Lebih dekat.<br />Lebih peduli.<br /><em>Lebih rukun.</em></h2>
        <p>
          Satu tempat untuk merawat data warga<br class="hidden xl:block" />
          dan kehidupan lingkungan bersama.
        </p>
      </div>
      <NeighborhoodArt />
      <div class="auth-story-footer">
        <span class="small-dot" /> Dari lingkungan, untuk lingkungan.
      </div>
    </aside>
    <main class="auth-main">
      <div class="auth-mobile-brand"><BrandMark /></div>
      <div class="auth-form-content"><RouterView /></div>
      <footer class="auth-footer">
        Rukun <span>·</span> Lebih mudah mengurus, lebih dekat bertetangga.
      </footer>
    </main>
  </div>
</template>
