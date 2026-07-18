import { useTranslation } from 'react-i18next'

/**
 * Shared full-height loading fallback — used as the Suspense fallback for lazy
 * routes and by ProtectedRoute while the session is still initializing.
 */
export function PageLoader() {
  const { t } = useTranslation()
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <div className="border-primary mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
        <p className="text-color-secondary text-sm">{t('Loading...')}</p>
      </div>
    </div>
  )
}

export default PageLoader
