import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z.union([
    z.literal('/api'),
    z
      .string()
      .url()
      .regex(/^https?:\/\//, 'Use an HTTP(S) API URL'),
  ]),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
})

// Throws at app startup if env is invalid — fail fast.
const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  console.error('[rukun] Invalid environment configuration:')
  console.error(parsed.error.flatten().fieldErrors)
  throw new Error('Invalid environment configuration. Check console for details.')
}

export const env = parsed.data
