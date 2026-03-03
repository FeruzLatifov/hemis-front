/**
 * Sentry Error Boundary Component
 *
 * Purpose: Catch React errors and show user-friendly error page
 *
 * Features:
 * - Automatic error capture to Sentry
 * - Event ID display for user reporting
 * - Fallback UI with reload/home options
 * - User feedback dialog (optional)
 */

import * as Sentry from '@sentry/react'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import i18n from '@/i18n/config'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface ErrorFallbackProps {
  error: unknown
  componentStack: string
  eventId: string
  resetError: () => void
}

/**
 * Error Fallback Component
 *
 * Shown when an error occurs in React component tree
 */
function ErrorFallback({ error, eventId }: ErrorFallbackProps) {
  const handleGoHome = () => {
    window.location.href = '/'
  }

  const handleReload = () => {
    window.location.reload()
  }

  return (
    <div className="bg-muted flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="text-destructive h-8 w-8" />
            <div>
              <CardTitle>{i18n.t('An unexpected error occurred')}</CardTitle>
              <CardDescription>
                {i18n.t(
                  'An unexpected error occurred in the application. Please refresh the page or go to the home page.',
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Message */}
          <div className="rounded-md bg-red-50 p-3 dark:bg-red-950/30">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              {i18n.t('Error details')}:
            </p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-400">
              {error instanceof Error ? error.message : String(error)}
            </p>
          </div>

          {/* Event ID for Support */}
          {eventId && (
            <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-950/30">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                {i18n.t('Event ID (for support)')}:
              </p>
              <p className="mt-1 font-mono text-sm text-blue-700 dark:text-blue-400">{eventId}</p>
              <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                {i18n.t('Send this ID to the support team')}
              </p>
            </div>
          )}

          {/* Development Info */}
          {import.meta.env.DEV && error instanceof Error && (
            <details className="bg-muted rounded-md p-3">
              <summary className="text-foreground cursor-pointer text-sm font-medium">
                {i18n.t('Technical details (development only)')}
              </summary>
              <pre className="text-muted-foreground mt-2 overflow-auto text-xs">{error.stack}</pre>
            </details>
          )}
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button onClick={handleReload} variant="default" className="flex-1">
            <RefreshCw className="mr-2 h-4 w-4" />
            {i18n.t('Refresh page')}
          </Button>
          <Button onClick={handleGoHome} variant="outline" className="flex-1">
            <Home className="mr-2 h-4 w-4" />
            {i18n.t('Home page')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

/**
 * Sentry Error Boundary
 *
 * Wrap your app with this component to catch errors
 *
 * @example
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */
export const ErrorBoundary = Sentry.withErrorBoundary(
  ({ children }: { children: React.ReactNode }) => <>{children}</>,
  {
    fallback: ErrorFallback,
    showDialog: false, // Don't show Sentry dialog (we have our own UI)
    beforeCapture: (scope, _error, componentStack) => {
      // Add component stack to Sentry
      scope.setContext('react', {
        componentStack,
      })
    },
  },
)

export default ErrorBoundary
