<script setup lang="ts">
import { tr } from '@/i18n'
import DisplayPreferences from '@/app/components/DisplayPreferences.vue'
import BrandMark from '@/app/components/BrandMark.vue'
import NeighborhoodArt from '@/app/components/NeighborhoodArt.vue'
</script>
<template>
  <div class="auth-layout">
    <aside class="auth-story">
      <BrandMark light />
      <div class="auth-story-copy">
        <span class="eyebrow"> {{ tr('RUANG UNTUK BERTETANGGA') }} </span>
        <h2>
          {{ tr('Lebih dekat.') }} <br />
          {{ tr('Lebih peduli.') }} <br /><em> {{ tr('Lebih rukun.') }} </em>
        </h2>
        <p>
          {{ tr('Satu tempat untuk merawat data warga') }} <br class="hidden xl:block" />
          {{ tr('dan kehidupan lingkungan bersama.') }}
        </p>
      </div>
      <NeighborhoodArt />
      <div class="auth-story-footer">
        <span class="small-dot" /> {{ tr('Dari lingkungan, untuk lingkungan.') }}
      </div>
    </aside>
    <main class="auth-main">
      <div class="auth-preferences"><DisplayPreferences /></div>
      <div class="auth-mobile-brand"><BrandMark /></div>
      <div class="auth-form-content"><RouterView /></div>
      <footer class="auth-footer">
        Rukun <span>·</span> {{ tr('Lebih mudah mengurus, lebih dekat bertetangga.') }}
      </footer>
    </main>
  </div>
</template>
