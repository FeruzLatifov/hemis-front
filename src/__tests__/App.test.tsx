/**
 * App Component Tests
 *
 * Tests rendering, route protection, auth redirect,
 * and auth:logout event handling.
 */

import { render, screen, act, waitFor } from '@testing-library/react'

// ---------------------------------------------------------------------------
// Mocks - must be defined before imports
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'uz', changeLanguage: vi.fn(), on: vi.fn(), off: vi.fn() },
  }),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

vi.mock('@/i18n/config', () => ({
  default: {
    t: (key: string) => key,
    language: 'uz',
    changeLanguage: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
  shortToBcp47: { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US', oz: 'oz-UZ' },
}))

const mockInitialize = vi.fn()
const mockLogout = vi.fn()

let mockIsAuthenticated = false
let mockPermissions: string[] = []

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector?: (state: Record<string, unknown>) => unknown) => {
    const state = {
      isAuthenticated: mockIsAuthenticated,
      user: mockIsAuthenticated ? { username: 'TestAdmin', locale: 'uz' } : null,
      university: null,
      permissions: mockPermissions,
      initialize: mockInitialize,
      logout: mockLogout,
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/hooks/useMenuInit', () => ({
  useMenuInit: vi.fn(() => ({ isLoading: false, error: null, hasMenu: true })),
}))

vi.mock('@/stores/menuStore', () => ({
  useMenuStore: vi.fn((selector?: (state: Record<string, unknown>) => unknown) => {
    const state = {
      menuItems: [],
      isLoading: false,
      setMenuItems: vi.fn(),
      setLoading: vi.fn(),
      clearMenu: vi.fn(),
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
  useRootMenuItems: vi.fn(() => []),
  useMenuLoading: vi.fn(() => false),
}))

vi.mock('@/stores/favoritesStore', () => ({
  useFavoritesStore: vi.fn((selector?: (state: Record<string, unknown>) => unknown) => {
    const state = { favorites: [], isFavorite: () => false, clearFavorites: vi.fn() }
    return typeof selector === 'function' ? selector(state) : state
  }),
  useFavoritesList: vi.fn(() => []),
}))

vi.mock('@/hooks/useFavorites', () => ({
  useAddFavorite: () => ({ mutate: vi.fn() }),
  useRemoveFavorite: () => ({ mutate: vi.fn() }),
  useFavoritesQuery: () => ({ data: [] }),
}))

vi.mock('@/hooks/useMenu', () => ({
  useMenu: () => ({ data: null, isLoading: false, error: null }),
}))

vi.mock('@/hooks/useClearCache', () => ({
  useClearCache: () => ({ isClearingCache: false, clearCache: vi.fn() }),
}))

vi.mock('@/utils/iconMapper', () => ({
  getIcon: () => {
    const MockIcon = (props: React.HTMLAttributes<HTMLSpanElement>) => (
      <span data-testid="mock-icon" {...props} />
    )
    return MockIcon
  },
}))

vi.mock('@/utils/menu.util', () => ({
  getMenuLabel: (item: { labelUz?: string } | null) => item?.labelUz || '',
}))

vi.mock('@/api/menu.api', () => ({
  flattenMenuTree: () => [],
}))

vi.mock('@/lib/queryKeys', () => ({
  queryKeys: {
    menu: { all: ['menu'] },
    favorites: { all: ['favorites'], list: ['favorites', 'list'] },
  },
}))

// Mock lazy-loaded pages
vi.mock('@/pages/LoginPage', () => ({
  default: () => <div data-testid="login-page">Login Page</div>,
}))

vi.mock('@/pages/dashboard/DashboardPage', () => ({
  default: () => <div data-testid="dashboard-page">Dashboard Page</div>,
}))

vi.mock('@/pages/students/StudentsPage', () => ({
  default: () => <div data-testid="students-page">Students Page</div>,
}))

vi.mock('@/pages/teachers/TeachersPage', () => ({
  default: () => <div data-testid="teachers-page">Teachers Page</div>,
}))

vi.mock('@/pages/reports/ReportsPage', () => ({
  default: () => <div data-testid="reports-page">Reports Page</div>,
}))

vi.mock('@/pages/system/translations', () => ({
  TranslationsPage: () => <div data-testid="translations-page">Translations</div>,
  TranslationFormPage: () => <div data-testid="translation-form-page">Translation Form</div>,
}))

vi.mock('@/pages/institutions/universities', () => ({
  UniversitiesPage: () => <div data-testid="universities-page">Universities</div>,
}))

vi.mock('@/pages/institutions/faculties', () => ({
  FacultiesPage: () => <div data-testid="faculties-page">Faculties</div>,
}))

vi.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/ThemeProvider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('sonner', () => ({
  Toaster: () => <div data-testid="toaster" />,
}))

vi.mock('@sentry/react', () => ({
  withErrorBoundary: <T,>(Component: T) => Component,
  init: vi.fn(),
  captureException: vi.fn(),
}))

vi.mock('@/assets/images/hemis-logo-new.png', () => ({
  default: 'hemis-logo.png',
}))

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import App from '@/App'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAuthenticated = false
    mockPermissions = []
  })

  it('renders without crashing', async () => {
    const { container } = render(<App />)
    await waitFor(() => {
      expect(container).toBeTruthy()
    })
  })

  it('calls initialize on mount', async () => {
    render(<App />)
    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalled()
    })
  })

  it('renders Toaster for notifications', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByTestId('toaster')).toBeInTheDocument()
    })
  })

  it('unauthenticated user is redirected to login from protected routes', async () => {
    mockIsAuthenticated = false

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
  })

  it('listens for auth:logout events and calls logout', async () => {
    mockIsAuthenticated = true

    render(<App />)

    act(() => {
      window.dispatchEvent(new Event('auth:logout'))
    })

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled()
    })
  })

  it('cleans up auth:logout listener on unmount', async () => {
    mockIsAuthenticated = true

    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = render(<App />)
    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('auth:logout', expect.any(Function))

    removeEventListenerSpy.mockRestore()
  })
})

describe('ProtectedRoute behavior (via App routing)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to /login when not authenticated', async () => {
    mockIsAuthenticated = false
    mockPermissions = []

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
  })

  it('authenticated user sees protected content (not redirected to login)', async () => {
    mockIsAuthenticated = true
    mockPermissions = []

    // Reset browser location to root before test
    window.history.pushState({}, '', '/')

    render(<App />)

    await waitFor(() => {
      // Authenticated user at / should not be stuck on login page
      // They should see some protected content (MainLayout with navigation)
      const nav = screen.queryByLabelText('Main navigation')
      const loginPage = screen.queryByTestId('login-page')
      // Either we see the navigation (authenticated) or at least not ONLY login
      expect(nav !== null || loginPage === null).toBe(true)
    })
  })
})
