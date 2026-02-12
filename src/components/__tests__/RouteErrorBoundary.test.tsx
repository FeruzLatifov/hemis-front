/**
 * Tests for RouteErrorBoundary
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary'

// Mock Sentry
vi.mock('@sentry/react', () => ({
  withScope: vi.fn((cb) => cb({ setTag: vi.fn(), setContext: vi.fn() })),
  captureException: vi.fn(),
}))

// Mock i18n
vi.mock('@/i18n/config', () => ({
  default: {
    t: (key: string) => key,
    language: 'en',
  },
}))

// Problem child component
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>Child content</div>
}

describe('RouteErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.error for error boundary tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when no error', () => {
    render(
      <RouteErrorBoundary>
        <div>Working content</div>
      </RouteErrorBoundary>,
    )

    expect(screen.getByText('Working content')).toBeInTheDocument()
  })

  it('shows error UI when child throws', () => {
    render(
      <RouteErrorBoundary>
        <ThrowError shouldThrow={true} />
      </RouteErrorBoundary>,
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('shows Try again button', () => {
    render(
      <RouteErrorBoundary>
        <ThrowError shouldThrow={true} />
      </RouteErrorBoundary>,
    )

    expect(screen.getByText('Try again')).toBeInTheDocument()
  })

  it('shows Go back button', () => {
    render(
      <RouteErrorBoundary>
        <ThrowError shouldThrow={true} />
      </RouteErrorBoundary>,
    )

    expect(screen.getByText('Go back')).toBeInTheDocument()
  })

  it('resets error on Try again click', async () => {
    const user = userEvent.setup()
    let shouldThrow = true

    function ConditionalError() {
      if (shouldThrow) throw new Error('Temporary error')
      return <div>Recovered</div>
    }

    const { rerender } = render(
      <RouteErrorBoundary>
        <ConditionalError />
      </RouteErrorBoundary>,
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    // Fix the error before clicking retry
    shouldThrow = false

    await user.click(screen.getByText('Try again'))

    // Should attempt to re-render children
    rerender(
      <RouteErrorBoundary>
        <ConditionalError />
      </RouteErrorBoundary>,
    )
  })

  it('calls Sentry.captureException on error', async () => {
    const { captureException } = await import('@sentry/react')

    render(
      <RouteErrorBoundary>
        <ThrowError shouldThrow={true} />
      </RouteErrorBoundary>,
    )

    expect(captureException).toHaveBeenCalledWith(expect.any(Error))
  })

  it('shows description text', () => {
    render(
      <RouteErrorBoundary>
        <ThrowError shouldThrow={true} />
      </RouteErrorBoundary>,
    )

    expect(
      screen.getByText('An error occurred while loading this page. Please try again.'),
    ).toBeInTheDocument()
  })
})
