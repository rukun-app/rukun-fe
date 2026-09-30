import { ref } from 'vue'
export const darkMode = ref(false)
export function applyTheme(dark: boolean, persist = true) {
  darkMode.value = dark
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  if (persist) {
    try {
      localStorage.setItem('rukun:theme', dark ? 'dark' : 'light')
    } catch {
      /* Storage may be blocked. */
    }
  }
}
export function initializeTheme() {
  let saved: string | null = null
  try {
    saved = localStorage.getItem('rukun:theme')
  } catch {
    /* Use system preference. */
  }
  applyTheme(
    saved === 'dark' ||
      (saved !== 'light' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches),
    false,
  )
}
