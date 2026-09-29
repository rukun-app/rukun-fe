<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Menu from 'primevue/menu'
import { session } from '@/auth/stores/session'
import { useAuth } from '@/auth/composables/useAuth'
const { logout, loading } = useAuth()
const router = useRouter()
const menu = ref<InstanceType<typeof Menu>>()
const user = computed(() => session.getUser())
const initials = computed(() =>
  (user.value?.name ?? 'Pengguna')
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase(),
)
const items = computed(() => [
  {
    label: 'Ganti akses',
    icon: 'pi pi-arrow-right-arrow-left',
    command: () => router.push('/auth/select-context'),
  },
  { separator: true },
  { label: 'Keluar', icon: 'pi pi-sign-out', disabled: loading.value, command: logout },
])
</script>
<template>
  <div class="account-actions">
    <button
      type="button"
      class="account-trigger"
      aria-label="Menu akun"
      aria-haspopup="menu"
      aria-controls="account-menu"
      :disabled="loading"
      @click="menu?.toggle($event)"
    >
      <span class="user-avatar">{{ initials }}</span
      ><span class="account-name">{{ user?.name ?? 'Akun saya' }}</span
      ><i class="pi pi-angle-down" aria-hidden="true" />
    </button>
    <Menu id="account-menu" ref="menu" :model="items" popup />
  </div>
</template>
