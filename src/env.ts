import { z } from 'zod'

// Runtime config (injected by docker-entrypoint.sh via /config.js)
const runtimeConfig = (window as unknown as Record<string, unknown>).__HEMIS_CONFIG__ as
  | Record<string, string>
  | undefined

/**
 * Get config value: runtime (ConfigMap) > build-time (Vite) > default
 */
function getEnv(key: string): string | undefined {
  return runtimeConfig?.[key] || import.meta.env[key] || undefined
}

const envSchema = z.object({
  VITE_API_URL: z.string().default(''),
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
    VITE_API_URL: getEnv('VITE_API_URL'),
    VITE_APP_NAME: getEnv('VITE_APP_NAME'),
    VITE_APP_VERSION: getEnv('VITE_APP_VERSION'),
    VITE_SENTRY_ENABLED: getEnv('VITE_SENTRY_ENABLED'),
    VITE_SENTRY_DSN: getEnv('VITE_SENTRY_DSN'),
    VITE_SENTRY_ENVIRONMENT: getEnv('VITE_SENTRY_ENVIRONMENT'),
    VITE_SENTRY_RELEASE: getEnv('VITE_SENTRY_RELEASE'),
    VITE_SENTRY_TRACES_SAMPLE_RATE: getEnv('VITE_SENTRY_TRACES_SAMPLE_RATE'),
    VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE: getEnv('VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE'),
    VITE_SENTRY_REPLAY_ERROR_SAMPLE_RATE: getEnv('VITE_SENTRY_REPLAY_ERROR_SAMPLE_RATE'),
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
