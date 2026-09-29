<script setup lang="ts">
import { computed } from 'vue'
import { session } from '@/auth/stores/session'
import { useContextStore } from '@/contexts/stores/context'
const context = useContextStore()
const cards = computed(() =>
  [
    {
      title: 'Kartu Keluarga',
      description: 'Kelola rumah tangga, alamat, dan anggota keluarga.',
      to: '/manage/households',
      capability: 'households.view',
      icon: 'pi pi-home',
    },
    {
      title: 'Warga',
      description: 'Lihat dan perbarui data warga yang terdaftar.',
      to: '/manage/residents',
      capability: 'residents.view',
      icon: 'pi pi-users',
    },
    {
      title: 'Wilayah RT / RW',
      description: 'Lihat struktur wilayah lingkungan.',
      to: '/manage/areas',
      capability: 'areas.view',
      icon: 'pi pi-sitemap',
    },
  ].filter((card) => context.can(card.capability)),
)
</script>
<template>
  <section class="p-4 md:p-8 space-y-6">
    <div>
      <p class="text-primary-700 font-medium">{{ context.activeContext?.label }}</p>
      <h2 class="text-2xl font-semibold mt-2">Selamat datang, {{ session.getUser()?.name }}</h2>
      <p class="text-surface-500 mt-2">Pilih data yang ingin Anda kelola hari ini.</p>
    </div>
    <div class="grid md:grid-cols-3 gap-4">
      <RouterLink
        v-for="card in cards"
        :key="card.to"
        :to="card.to"
        class="bg-surface-0 border border-surface-200 rounded-xl p-6 hover:border-primary-500"
        ><i :class="card.icon" class="text-primary-600 text-2xl" />
        <h3 class="font-semibold mt-4">{{ card.title }}</h3>
        <p class="text-sm text-surface-500 mt-2">{{ card.description }}</p></RouterLink
      >
    </div>
  </section>
</template>
