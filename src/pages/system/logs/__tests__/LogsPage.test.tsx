import { render, screen } from '@/test/test-utils'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'uz', changeLanguage: vi.fn(), on: vi.fn(), off: vi.fn() },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  }
})

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector?: (state: Record<string, unknown>) => unknown) => {
    const state = {
      isAuthenticated: true,
      user: { name: 'Admin', locale: 'uz' },
      permissions: ['audit.view'],
    }
    return selector ? selector(state) : state
  }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}))

vi.mock('@/hooks/useAuditLogs', () => ({
  useActivityLogs: () => ({ data: { content: [], totalElements: 0 }, isLoading: false }),
  useErrorLogs: () => ({ data: { content: [], totalElements: 0 }, isLoading: false }),
  useLoginLogs: () => ({ data: { content: [], totalElements: 0 }, isLoading: false }),
  useAuditStats: () => ({ data: undefined, isLoading: false }),
}))

import LogsPage from '../LogsPage'

describe('LogsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the page title and subtitle', () => {
    render(<LogsPage />)
    expect(screen.getByText('Audit Logs')).toBeInTheDocument()
    expect(screen.getByText('Audit information')).toBeInTheDocument()
  })

  it('renders the search input and date range filters', () => {
    render(<LogsPage />)
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Date from')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Date to')).toBeInTheDocument()
  })

  it('renders the three log tabs (activity / errors / login)', () => {
    render(<LogsPage />)
    expect(screen.getByText('Activity')).toBeInTheDocument()
    expect(screen.getByText('Errors')).toBeInTheDocument()
    expect(screen.getByText('Login')).toBeInTheDocument()
  })
})
