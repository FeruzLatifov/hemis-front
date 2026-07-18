import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface QueryStateBoundaryProps {
  /** Query is fetching with no cached data to show yet. */
  isLoading: boolean
  /** Query failed. Renders a distinct error+retry block, NOT the empty state. */
  isError: boolean
  /** Query succeeded but returned no rows. */
  isEmpty?: boolean
  /** Called by the Retry button in the error state. Usually the query's refetch. */
  onRetry?: () => void
  /** Custom loading UI (e.g. table skeleton rows). Defaults to generic skeletons. */
  loadingFallback?: ReactNode
  /** Custom empty UI. Defaults to a generic "no data" block. */
  emptyFallback?: ReactNode
  children: ReactNode
}

/**
 * One place that turns a TanStack Query's loading/error/empty into consistent UI.
 *
 * Why it exists: most list pages fall through to a "No data" empty state on a
 * 500/network failure, indistinguishable from a genuinely empty result. This
 * makes the error state explicit and recoverable (Retry) everywhere it's used.
 *
 * Order matters: loading → error → empty → children.
 */
export function QueryStateBoundary({
  isLoading,
  isError,
  isEmpty = false,
  onRetry,
  loadingFallback,
  emptyFallback,
  children,
}: QueryStateBoundaryProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <>
        {loadingFallback ?? (
          <div className="space-y-3" role="status" aria-busy="true" aria-live="polite">
            <span className="sr-only">{t('Loading...')}</span>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}
      </>
    )
  }

  if (isError) {
    return (
      <div
        className="flex h-64 flex-col items-center justify-center gap-3 text-center"
        role="alert"
      >
        <p className="text-[var(--text-secondary)]">{t('Failed to load data')}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            {t('Retry')}
          </Button>
        )}
      </div>
    )
  }

  if (isEmpty) {
    return (
      <>
        {emptyFallback ?? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
            <Inbox className="h-10 w-10 text-[var(--text-secondary)]" aria-hidden="true" />
            <p className="text-[var(--text-secondary)]">{t('No data found')}</p>
          </div>
        )}
      </>
    )
  }

  return <>{children}</>
}

export default QueryStateBoundary
