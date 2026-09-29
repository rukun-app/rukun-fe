import { defineConfig } from 'orval'

export default defineConfig({
  rukun: {
    input: {
      target: './openapi/rukun.json',
    },
    output: {
      target: './src/api/generated/endpoints.ts',
      tsconfig: './tsconfig.app.json',
      schemas: './src/api/generated/models',
      client: 'vue-query',
      override: {
        mutator: {
          path: './src/api/client/mutator.ts',
          name: 'apiRequest',
        },
      },
      prettier: true,
    },
  },
})
