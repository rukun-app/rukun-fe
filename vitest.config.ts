import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// Unit tests do not need PWA, Tailwind, or the development proxy.
export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['src/**/*.test.ts'],
    coverage: { provider: 'v8', include: ['src/**'], exclude: ['src/api/generated/**'] },
  },
})
