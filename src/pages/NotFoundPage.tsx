/**
 * 404 Not Found Page
 *
 * Professional 404 page with navigation options
 */

import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, ArrowLeft, Search, HelpCircle } from 'lucide-react'

export default function NotFoundPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ backgroundColor: 'var(--app-bg)' }}
    >
      <div className="w-full max-w-lg text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div
            className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--primary)', opacity: 0.1 }}
          >
            <Search className="h-16 w-16" style={{ color: 'var(--primary)' }} />
          </div>
          <h1
            className="mb-2 text-8xl font-bold tracking-tighter"
            style={{ color: 'var(--primary)' }}
          >
            404
          </h1>
          <h2 className="mb-4 text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {t('Page not found')}
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {t("Sorry, the page you're looking for doesn't exist or has been moved.")}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border-2 px-6 py-3 font-semibold transition-all hover:shadow-md"
            style={{
              borderColor: 'var(--border-color-pro)',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--text-primary)',
            }}
          >
            <ArrowLeft className="h-5 w-5" />
            {t('Go back')}
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            <Home className="h-5 w-5" />
            {t('Go to Dashboard')}
          </button>
        </div>

        {/* Help Section */}
        <div
          className="rounded-lg border p-6"
          style={{
            borderColor: 'var(--border-color-pro)',
            backgroundColor: 'var(--card-bg)',
          }}
        >
          <div className="mb-3 flex items-center justify-center gap-2">
            <HelpCircle className="h-5 w-5" style={{ color: 'var(--primary)' }} />
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('Need help?')}
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {t('If you believe this is an error, please contact the system administrator.')}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
            <a
              href="mailto:support@hemis.uz"
              className="hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              support@hemis.uz
            </a>
            <span style={{ color: 'var(--text-secondary)' }}>|</span>
            <a
              href="tel:+998712000000"
              className="hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              +998 71 200 00 00
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
