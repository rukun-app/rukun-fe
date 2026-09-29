import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'

import App from '@/App.vue'
import { router } from '@/app/router'
import { i18n } from '@/i18n'
import { installQuery } from '@/app/providers/query'
import { setContextIdProvider } from '@/api/client/http'
import { useContextStore } from '@/contexts/stores/context'
import { primeVueConfig } from '@/design-system/theme/preset'

import '@/assets/main.css'

export function bootstrap(): void {
  const app = createApp(App)

  const pinia = createPinia()
  app.use(pinia)

  // Wire context ID into HTTP interceptor after Pinia is ready
  const contextStore = useContextStore()
  setContextIdProvider(() => contextStore.activeContextId)

  app.use(router)
  app.use(i18n)

  installQuery(app)

  app.use(PrimeVue, primeVueConfig)
  app.use(ToastService)
  app.use(ConfirmationService)

  app.mount('#app')
}
