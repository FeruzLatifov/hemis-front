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

import * as Sentry from '@sentry/react';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorFallbackProps {
  error: Error;
  componentStack: string | null;
  eventId: string | null;
  resetError: () => void;
}

/**
 * Error Fallback Component
 *
 * Shown when an error occurs in React component tree
 */
function ErrorFallback({ error, eventId, resetError }: ErrorFallbackProps) {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
              <CardTitle>Xatolik yuz berdi</CardTitle>
              <CardDescription>
                Dasturda kutilmagan xatolik yuz berdi. Iltimos, sahifani yangilang yoki bosh sahifaga qayting.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Message */}
          <div className="rounded-md bg-red-50 p-3">
            <p className="text-sm font-medium text-red-800">Xatolik:</p>
            <p className="mt-1 text-sm text-red-700">{error.message}</p>
          </div>

          {/* Event ID for Support */}
          {eventId && (
            <div className="rounded-md bg-blue-50 p-3">
              <p className="text-sm font-medium text-blue-800">Event ID (qo'llab-quvvatlash uchun):</p>
              <p className="mt-1 font-mono text-sm text-blue-700">{eventId}</p>
              <p className="mt-2 text-xs text-blue-600">
                Bu ID'ni texnik yordam xizmatiga yuborishingiz mumkin.
              </p>
            </div>
          )}

          {/* Development Info */}
          {import.meta.env.DEV && (
            <details className="rounded-md bg-gray-100 p-3">
              <summary className="cursor-pointer text-sm font-medium text-gray-700">
                Texnik ma'lumot (faqat development)
              </summary>
              <pre className="mt-2 overflow-auto text-xs text-gray-600">{error.stack}</pre>
            </details>
          )}
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button onClick={handleReload} variant="default" className="flex-1">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sahifani yangilash
          </Button>
          <Button onClick={handleGoHome} variant="outline" className="flex-1">
            <Home className="mr-2 h-4 w-4" />
            Bosh sahifa
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
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
    beforeCapture: (scope, error, componentStack) => {
      // Add component stack to Sentry
      scope.setContext('react', {
        componentStack,
      });
    },
  }
);

export default ErrorBoundary;
