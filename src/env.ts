import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.string().url('VITE_API_URL must be a valid URL'),
  VITE_APP_NAME: z.string().default('HEMIS Ministry'),
  VITE_APP_VERSION: z.string().default('1.0.0'),
  VITE_SENTRY_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  VITE_SENTRY_DSN: z.string().default(''),
  VITE_SENTRY_ENVIRONMENT: z.string().default(''),
  VITE_SENTRY_RELEASE: z.string().default(''),
  VITE_SENTRY_TRACES_SAMPLE_RATE: z.string().default('0.2'),
  VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE: z.string().default('0.1'),
  VITE_SENTRY_REPLAY_ERROR_SAMPLE_RATE: z.string().default('1.0'),
})

function validateEnv() {
  const raw = {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
    VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
    VITE_SENTRY_ENABLED: import.meta.env.VITE_SENTRY_ENABLED,
    VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    VITE_SENTRY_ENVIRONMENT: import.meta.env.VITE_SENTRY_ENVIRONMENT,
    VITE_SENTRY_RELEASE: import.meta.env.VITE_SENTRY_RELEASE,
    VITE_SENTRY_TRACES_SAMPLE_RATE: import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE,
    VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE: import.meta.env.VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE,
    VITE_SENTRY_REPLAY_ERROR_SAMPLE_RATE: import.meta.env.VITE_SENTRY_REPLAY_ERROR_SAMPLE_RATE,
  }

  const result = envSchema.safeParse(raw)

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')

    console.error(`\n❌ Environment variable validation failed:\n${errors}\n`)
    throw new Error(`Invalid environment variables:\n${errors}`)
  }

  return result.data
}

export const env = validateEnv()
