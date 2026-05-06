import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Upload source maps to Sentry **only** when an auth token is present —
    // typically that's CI with `SENTRY_AUTH_TOKEN`/`SENTRY_ORG`/`SENTRY_PROJECT`
    // configured. Local builds and PR previews stay free of any Sentry side
    // effect, so devs and CI remain decoupled. See:
    // https://docs.sentry.io/platforms/javascript/sourcemaps/uploading/vite/
    ...(process.env.SENTRY_AUTH_TOKEN
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            sourcemaps: {
              // We generate maps in this build, ship the gzipped versions, and
              // delete them after upload — production users never download
              // .map files (privacy + bandwidth).
              filesToDeleteAfterUpload: ['./dist/**/*.map'],
            },
            release: {
              name: process.env.VITE_SENTRY_RELEASE,
            },
            telemetry: false,
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/stores': path.resolve(__dirname, './src/stores'),
      '@/pages': path.resolve(__dirname, './src/pages'),
    },
  },
  server: {
    port: 3000,
    host: true,
    headers: {
      // Security headers for development
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      // ✅ SECURITY FIX: CSP header for development (production uses nginx-security-headers.conf)
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' ws: wss: http://localhost:* http://172.18.9.1:* https://*.sentry.io; frame-ancestors 'self'; base-uri 'self'; form-action 'self'",
    },
  },
  build: {
    // Source maps are produced for every build; the Sentry plugin (when
    // configured in CI) uploads them to Sentry and then deletes the local
    // `.map` files so they never reach production users. Without an auth
    // token the maps stay on disk — useful for staging/preview deploys.
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-radix': [
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
          ],
          'vendor-tanstack': ['@tanstack/react-query', '@tanstack/react-table'],
          'vendor-i18n': ['i18next', 'react-i18next'],
          'vendor-sentry': ['@sentry/react'],
          'vendor-utils': [
            'axios',
            'zod',
            'zustand',
            'date-fns',
            'lucide-react',
            'sonner',
            'clsx',
            'tailwind-merge',
            'class-variance-authority',
          ],
        },
      },
    },
  },
})
