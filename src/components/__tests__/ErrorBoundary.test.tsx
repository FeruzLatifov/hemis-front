import { render, screen, fireEvent } from '@testing-library/react'

// Mock Sentry before importing ErrorBoundary
vi.mock('@sentry/react', () => ({
  withErrorBoundary: (
    Component: React.ComponentType<{ children: React.ReactNode }>,
    options: { fallback: React.ComponentType<unknown> },
  ) => {
    // Store fallback for testing
    const WrappedComponent = ({ children }: { children: React.ReactNode }) => {
      return <Component>{children}</Component>
    }
    WrappedComponent.displayName = 'ErrorBoundary'
    // Attach fallback so tests can access it
    ;(WrappedComponent as unknown as Record<string, unknown>).__fallback = options.fallback
    return WrappedComponent
  },
}))

// Mock i18n
vi.mock('@/i18n/config', () => ({
  default: {
    t: (key: string) => key,
  },
}))

// Need to import after mocks
import { ErrorBoundary } from '../ErrorBoundary'

// Extract the fallback component from the mocked ErrorBoundary
const ErrorFallback = (
  ErrorBoundary as unknown as Record<
    string,
    React.ComponentType<{
      error: unknown
      componentStack: string
      eventId: string
      resetError: () => void
    }>
  >
).__fallback

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Hello World</div>
      </ErrorBoundary>,
    )

    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })
})

describe('ErrorFallback', () => {
  const defaultProps = {
    error: new Error('Something went wrong'),
    componentStack: '<App>\n  <Dashboard>',
    eventId: 'abc123def456',
    resetError: vi.fn(),
  }

  it('displays error message', () => {
    render(<ErrorFallback {...defaultProps} />)

    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('displays event ID for support', () => {
    render(<ErrorFallback {...defaultProps} />)

    expect(screen.getByText('abc123def456')).toBeInTheDocument()
    expect(screen.getByText('Event ID (for support):')).toBeInTheDocument()
  })

  it('does not display event ID section when eventId is empty', () => {
    render(<ErrorFallback {...defaultProps} eventId="" />)

    expect(screen.queryByText('Event ID (for support):')).not.toBeInTheDocument()
  })

  it('has a reload button', () => {
    render(<ErrorFallback {...defaultProps} />)

    const reloadButton = screen.getByText('Refresh page')
    expect(reloadButton).toBeInTheDocument()
  })

  it('has a home button that navigates to /', () => {
    vi.stubGlobal('location', {
      ...window.location,
      href: '/some-page',
      reload: vi.fn(),
    })

    render(<ErrorFallback {...defaultProps} />)

    fireEvent.click(screen.getByText('Home page'))
    expect(window.location.href).toBe('/')

    vi.unstubAllGlobals()
  })

  it('handles non-Error objects as error prop', () => {
    render(<ErrorFallback {...defaultProps} error="String error message" />)

    expect(screen.getByText('String error message')).toBeInTheDocument()
  })

  it('reload button triggers window.location.reload', () => {
    // Render first with real location
    render(<ErrorFallback {...defaultProps} />)

    // Then stub location before clicking
    const reloadMock = vi.fn()
    vi.stubGlobal('location', {
      ...window.location,
      reload: reloadMock,
      href: '',
    })

    fireEvent.click(screen.getByText('Refresh page'))
    expect(reloadMock).toHaveBeenCalled()

    vi.unstubAllGlobals()
  })
})
