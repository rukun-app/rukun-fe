import { computed } from 'vue'
import { tr } from '@/i18n'
// PrimeVue 4 Password renders SVG toggle icons. PassThrough adds button semantics
// and keyboard activation while PrimeVue continues to own visibility state.
export function usePasswordPassThrough() {
  function activate(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    event.currentTarget?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  }
  const icon = (visible: boolean) => ({
    role: 'button',
    tabindex: 0,
    'aria-hidden': false,
    'aria-label': tr(visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'),
    'aria-pressed': visible,
    onKeydown: activate,
  })
  return computed(() => ({ maskIcon: icon(true), unmaskIcon: icon(false) }))
}
