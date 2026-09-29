import { createI18n } from 'vue-i18n'
import id from './locales/id'

export const i18n = createI18n({
  legacy: false,
  locale: 'id',
  fallbackLocale: 'id',
  messages: { id },
})
