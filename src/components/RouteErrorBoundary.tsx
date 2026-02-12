/**
 * Route-level Error Boundary
 *
 * Catches errors within individual routes to prevent the entire app from crashing.
 * Uses Sentry for error reporting with route-level tagging.
 *
 * @example
 * <RouteErrorBoundary>
 *   <DashboardPage />
 * </RouteErrorBoundary>
 */

import { Component, type ErrorInfo, type ReactNode } from 'react'
import * as Sentry from '@sentry/react'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import i18n from '@/i18n/config'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.withScope((scope) => {
      scope.setTag('boundary', 'route-level')
      scope.setContext('react', {
        componentStack: errorInfo.componentStack,
      })
      Sentry.captureException(error)
    })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  handleGoBack = () => {
    this.setState({ hasError: false, error: null })
    window.history.back()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">
              {i18n.t('Something went wrong')}
            </h2>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              {i18n.t('An error occurred while loading this page. Please try again.')}
            </p>
            {this.state.error && (
              <p className="mb-6 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                {this.state.error.message}
              </p>
            )}
            <div className="flex justify-center gap-3">
              <Button onClick={this.handleGoBack} variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {i18n.t('Go back')}
              </Button>
              <Button onClick={this.handleRetry} size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                {i18n.t('Try again')}
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default RouteErrorBoundary
