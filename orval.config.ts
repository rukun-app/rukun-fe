import { defineConfig } from 'orval'

export default defineConfig({
  rukun: {
    input: {
      target: '../rukun-be/docs/openapi.yaml', // ponytail: path to BE openapi; change when BE repo path differs
    },
    output: {
      target: './src/api/generated/endpoints.ts',
      schemas: './src/api/generated/models',
      client: 'vue-query',
      override: {
        mutator: {
          path: './src/api/client/http.ts',
          name: 'http',
        },
      },
      prettier: true,
    },
  },
})
