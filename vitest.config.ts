import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: false,
      include: ['src/**/*.test.ts'],
      coverage: {
        provider: 'v8',
        include: ['src/**'],
        exclude: ['src/api/generated/**'],
      },
    },
  }),
)
