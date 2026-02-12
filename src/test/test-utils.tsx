/**
 * Test Utilities
 *
 * Custom render functions and test helpers with all providers.
 * Import as: import { render, screen, waitFor } from '@/test/test-utils'
 */

import { render, type RenderOptions, type RenderResult } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, MemoryRouter } from 'react-router'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n/config'
import type { ReactElement, ReactNode } from 'react'

// ============================================================================
// Query Client Factory
// ============================================================================

/**
 * Create a fresh QueryClient for each test
 * Disables retries and caching to make tests deterministic
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

// ============================================================================
// Wrapper Props & Options
// ============================================================================

interface WrapperProps {
  children: ReactNode
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
  initialRoute?: string
  useMemoryRouter?: boolean
}

interface CustomRenderResult extends RenderResult {
  queryClient: QueryClient
}

// ============================================================================
// Custom Render Functions
// ============================================================================

/**
 * Custom render with all providers (QueryClient, Router, i18n)
 *
 * @example
 * // Basic usage
 * const { getByText } = render(<MyComponent />)
 *
 * // With custom query client
 * const queryClient = createTestQueryClient()
 * const { getByText } = render(<MyComponent />, { queryClient })
 *
 * // With initial route (for testing routing)
 * const { getByText } = render(<MyComponent />, {
 *   initialRoute: '/universities/123',
 *   useMemoryRouter: true,
 * })
 */
function customRender(ui: ReactElement, options: CustomRenderOptions = {}): CustomRenderResult {
  const {
    queryClient = createTestQueryClient(),
    initialRoute = '/',
    useMemoryRouter = false,
    ...renderOptions
  } = options

  function Wrapper({ children }: WrapperProps) {
    const Router = useMemoryRouter ? MemoryRouter : BrowserRouter
    const routerProps = useMemoryRouter ? { initialEntries: [initialRoute] } : {}

    return (
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <Router {...routerProps}>{children}</Router>
        </I18nextProvider>
      </QueryClientProvider>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  }
}

/**
 * Render without router (for components that don't need routing)
 */
export function renderWithoutRouter(
  ui: ReactElement,
  options: Omit<CustomRenderOptions, 'initialRoute' | 'useMemoryRouter'> = {},
): CustomRenderResult {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options

  function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
      </QueryClientProvider>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  }
}

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Wait for loading state to finish
 *
 * @example
 * render(<MyComponent />)
 * await waitForLoadingToFinish()
 * expect(screen.getByText('Data loaded')).toBeInTheDocument()
 */
export async function waitForLoadingToFinish(): Promise<void> {
  const { waitFor, screen } = await import('@testing-library/react')

  await waitFor(() => {
    const loadingElements = screen.queryAllByText(/loading/i)
    const spinners = screen.queryAllByRole('progressbar')
    const skeletons = document.querySelectorAll('[class*="skeleton"]')

    expect(loadingElements.length + spinners.length + skeletons.length).toBe(0)
  })
}

/**
 * Create a mock API response
 */
export function createMockResponse<T>(data: T, delay = 0): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay)
  })
}

/**
 * Create a mock API error
 */
export function createMockError(message: string, status = 500, delay = 0): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error(message) as Error & { response: { status: number } }
      error.response = { status }
      reject(error)
    }, delay)
  })
}

/**
 * Create a paged response mock
 */
export function createPagedResponse<T>(
  content: T[],
  page = 0,
  size = 20,
  totalElements = content.length,
) {
  return {
    content,
    totalElements,
    totalPages: Math.ceil(totalElements / size),
    size,
    number: page,
    first: page === 0,
    last: page >= Math.ceil(totalElements / size) - 1,
    empty: content.length === 0,
  }
}

// ============================================================================
// Re-exports
// ============================================================================

// Re-export everything from RTL
// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react'

// Override render with wrapped version
export { customRender as render }
