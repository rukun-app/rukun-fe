<script setup lang="ts">
import { darkMode, applyTheme } from '@/shared/preferences/theme'
import { i18n, setLocale } from '@/i18n'
const locale = i18n.global.locale
</script>
<template>
  <div class="display-preferences">
    <button
      type="button"
      class="theme-toggle"
      :aria-label="
        locale === 'id'
          ? darkMode
            ? 'Aktifkan mode terang'
            : 'Aktifkan mode gelap'
          : darkMode
            ? 'Use light mode'
            : 'Use dark mode'
      "
      :aria-pressed="darkMode"
      @click="applyTheme(!darkMode)"
    >
      <i :class="darkMode ? 'pi pi-sun' : 'pi pi-moon'" aria-hidden="true" />
    </button>
    <select
      :value="locale"
      :aria-label="locale === 'id' ? 'Bahasa' : 'Language'"
      @change="setLocale(($event.target as HTMLSelectElement).value)"
    >
      <option value="id">ID</option>
      <option value="en">EN</option>
    </select>
  </div>
</template>
