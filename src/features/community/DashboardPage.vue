<script setup lang="ts">
import { computed } from 'vue'
import { session } from '@/auth/stores/session'
import { useContextStore } from '@/contexts/stores/context'
import NeighborhoodArt from '@/app/components/NeighborhoodArt.vue'
const context = useContextStore()
const date = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date())
const cards = computed(() =>
  [
    {
      title: 'Kartu Keluarga',
      description: 'Rumah tangga, alamat, dan anggota keluarga dalam satu tempat.',
      to: '/manage/households',
      capability: 'households.view',
      icon: 'pi pi-home',
      tone: 'green',
      action: 'Kelola keluarga',
    },
    {
      title: 'Data Warga',
      description: 'Kenali warga melalui data yang lengkap dan selalu terbarui.',
      to: '/manage/residents',
      capability: 'residents.view',
      icon: 'pi pi-users',
      tone: 'orange',
      action: 'Lihat data warga',
    },
    {
      title: 'Wilayah RT / RW',
      description: 'Susun struktur wilayah sebagai dasar pendataan lingkungan.',
      to: '/manage/areas',
      capability: 'areas.view',
      icon: 'pi pi-map',
      tone: 'blue',
      action: 'Lihat wilayah',
    },
  ].filter((card) => context.can(card.capability)),
)
const steps = computed(() =>
  [
    {
      number: '01',
      title: 'Tentukan wilayah',
      detail: 'Daftarkan RW dan RT lingkungan.',
      to: '/manage/areas',
      capability: 'areas.view',
    },
    {
      number: '02',
      title: 'Catat kartu keluarga',
      detail: 'Hubungkan rumah tangga ke wilayahnya.',
      to: '/manage/households',
      capability: 'households.view',
    },
    {
      number: '03',
      title: 'Lengkapi data warga',
      detail: 'Tambahkan anggota ke setiap keluarga.',
      to: '/manage/residents',
      capability: 'residents.view',
    },
  ].filter((step) => context.can(step.capability)),
)
</script>
<template>
  <section class="page-container dashboard-page">
    <div class="dashboard-greeting">
      <div>
        <p class="eyebrow">RUANG PENGURUS</p>
        <h2>Selamat datang, {{ session.getUser()?.name }}</h2>
      </div>
      <span class="date-label"><i class="pi pi-calendar" aria-hidden="true" />{{ date }}</span>
    </div>
    <div class="dashboard-hero">
      <div class="hero-copy">
        <span class="hero-pill"><span class="small-dot" /> Bersama membangun lingkungan</span>
        <h3>Lingkungan tertata.<br /><em>Warga terhubung.</em></h3>
        <p>
          Mulai dari data yang rapi untuk membuat<br class="hidden lg:block" />
          urusan bertetangga jadi lebih mudah.
        </p>
        <RouterLink
          v-if="context.can('households.view')"
          to="/manage/households"
          class="hero-action"
          >Kelola data keluarga <i class="pi pi-arrow-up-right" aria-hidden="true"
        /></RouterLink>
      </div>
      <NeighborhoodArt />
    </div>
    <div class="section-heading">
      <div>
        <h3>Data lingkungan</h3>
        <p>Semua yang Anda perlukan untuk pendataan sehari-hari.</p>
      </div>
      <span class="subtle-label">PENGELOLAAN</span>
    </div>
    <div class="dashboard-cards">
      <RouterLink
        v-for="card in cards"
        :key="card.to"
        :to="card.to"
        class="module-card"
        :class="`tone-${card.tone}`"
        ><div class="module-card-top">
          <span class="module-icon"><i :class="card.icon" aria-hidden="true" /></span
          ><i class="pi pi-arrow-up-right module-arrow" aria-hidden="true" />
        </div>
        <h3>{{ card.title }}</h3>
        <p>{{ card.description }}</p>
        <span class="module-card-link"
          >{{ card.action }} <i class="pi pi-arrow-right" aria-hidden="true" /></span
      ></RouterLink>
    </div>
    <div class="onboarding-panel">
      <div class="onboarding-heading">
        <span class="guide-icon"><i class="pi pi-compass" aria-hidden="true" /></span>
        <div>
          <h3>Mulai dari mana?</h3>
          <p>Ikuti alur pendataan lingkungan berikut.</p>
        </div>
      </div>
      <div class="onboarding-steps">
        <RouterLink v-for="step in steps" :key="step.number" :to="step.to"
          ><span class="step-number">{{ step.number }}</span>
          <div>
            <strong>{{ step.title }}</strong>
            <p>{{ step.detail }}</p>
          </div>
          <i class="pi pi-angle-right" aria-hidden="true"
        /></RouterLink>
      </div>
    </div>
  </section>
</template>
