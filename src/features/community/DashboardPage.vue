<script setup lang="ts">
import { tr, i18n } from '@/i18n'
import { computed } from 'vue'
import { session } from '@/auth/stores/session'
import { useContextStore } from '@/contexts/stores/context'
import NeighborhoodArt from '@/app/components/NeighborhoodArt.vue'
const context = useContextStore()
const date = computed(() =>
  new Intl.DateTimeFormat(i18n.global.locale.value === 'en' ? 'en-GB' : 'id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date()),
)
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
        <p class="eyebrow">{{ tr('RUANG PENGURUS') }}</p>
        <h2>{{ tr('Selamat datang,') }} {{ session.getUser()?.name }}</h2>
      </div>
      <span class="date-label"><i class="pi pi-calendar" aria-hidden="true" />{{ date }}</span>
    </div>
    <div class="dashboard-hero">
      <div class="hero-copy">
        <span class="hero-pill"
          ><span class="small-dot" /> {{ tr('Bersama membangun lingkungan') }}
        </span>
        <h3>
          {{ tr('Lingkungan tertata.') }} <br /><em> {{ tr('Warga terhubung.') }} </em>
        </h3>
        <p>
          {{ tr('Mulai dari data yang rapi untuk membuat') }} <br class="hidden lg:block" />
          {{ tr('urusan bertetangga jadi lebih mudah.') }}
        </p>
        <RouterLink
          v-if="context.can('households.view')"
          to="/manage/households"
          class="hero-action"
        >
          {{ tr('Kelola data keluarga') }} <i class="pi pi-arrow-up-right" aria-hidden="true"
        /></RouterLink>
      </div>
      <NeighborhoodArt />
    </div>
    <div class="section-heading">
      <div>
        <h3>{{ tr('Data lingkungan') }}</h3>
        <p>{{ tr('Semua yang Anda perlukan untuk pendataan sehari-hari.') }}</p>
      </div>
      <span class="subtle-label"> {{ tr('PENGELOLAAN') }} </span>
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
        <h3>{{ tr(card.title) }}</h3>
        <p>{{ tr(card.description) }}</p>
        <span class="module-card-link"
          >{{ tr(card.action) }} <i class="pi pi-arrow-right" aria-hidden="true" /></span
      ></RouterLink>
    </div>
    <div class="onboarding-panel">
      <div class="onboarding-heading">
        <span class="guide-icon"><i class="pi pi-compass" aria-hidden="true" /></span>
        <div>
          <h3>{{ tr('Mulai dari mana?') }}</h3>
          <p>{{ tr('Ikuti alur pendataan lingkungan berikut.') }}</p>
        </div>
      </div>
      <div class="onboarding-steps">
        <RouterLink v-for="step in steps" :key="step.number" :to="step.to"
          ><span class="step-number">{{ step.number }}</span>
          <div>
            <strong>{{ tr(step.title) }}</strong>
            <p>{{ tr(step.detail) }}</p>
          </div>
          <i class="pi pi-angle-right" aria-hidden="true"
        /></RouterLink>
      </div>
    </div>
  </section>
</template>
