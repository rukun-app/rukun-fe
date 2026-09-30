import { onBeforeUnmount, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from 'vue-router'
import { tr } from '@/i18n'
/** Native unload confirmation is required for closing/reloading the browser tab. */
export function useUnsavedChanges() {
  const dirty = ref(false)
  const route = useRoute()
  const confirmLeave = () =>
    !dirty.value || window.confirm(tr('Perubahan belum disimpan. Tinggalkan halaman?'))
  onBeforeRouteLeave(confirmLeave)
  onBeforeRouteUpdate(confirmLeave)
  watch(
    () => route.fullPath,
    () => {
      dirty.value = false
    },
  )
  function beforeUnload(event: BeforeUnloadEvent) {
    if (!dirty.value) return
    event.preventDefault()
    event.returnValue = ''
  }
  window.addEventListener('beforeunload', beforeUnload)
  onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
  return { dirty }
}
