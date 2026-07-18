/**
 * 403 Forbidden Page
 *
 * Shown when an authenticated user lacks the permission required for a route.
 * Rendered in place (URL preserved) rather than a silent redirect, so the denial is visible.
 */

import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, ArrowLeft, ShieldAlert, HelpCircle } from 'lucide-react'

export default function ForbiddenPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--app-bg)] px-4">
      <div className="w-full max-w-lg text-center">
        {/* 403 Illustration */}
        <div className="mb-8">
          <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-[var(--primary)] opacity-10">
            <ShieldAlert className="h-16 w-16 text-[var(--primary)]" />
          </div>
          <h1 className="mb-2 text-8xl font-bold tracking-tighter text-[var(--primary)]">403</h1>
          <h2 className="mb-4 text-2xl font-semibold text-[var(--text-primary)]">
            {t('Access denied')}
          </h2>
          <p className="text-base leading-relaxed text-[var(--text-secondary)]">
            {t("You don't have permission to access this page.")}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-[var(--border-color-pro)] bg-[var(--card-bg)] px-6 py-3 font-semibold text-[var(--text-primary)] transition-all hover:shadow-md"
          >
            <ArrowLeft className="h-5 w-5" />
            {t('Go back')}
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl"
          >
            <Home className="h-5 w-5" />
            {t('Go to Dashboard')}
          </button>
        </div>

        {/* Help Section */}
        <div className="rounded-lg border border-[var(--border-color-pro)] bg-[var(--card-bg)] p-6">
          <div className="mb-3 flex items-center justify-center gap-2">
            <HelpCircle className="h-5 w-5 text-[var(--primary)]" />
            <span className="font-semibold text-[var(--text-primary)]">{t('Need help?')}</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            {t('If you believe this is an error, please contact the system administrator.')}
          </p>
        </div>
      </div>
    </div>
  )
}
