import { render, screen } from '@/test/test-utils'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params) {
        let result = key
        Object.entries(params).forEach(([k, v]) => {
          result = result.replace(`{{${k}}}`, String(v))
        })
        return result
      }
      return key
    },
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
      // Full management permissions so the page renders the create/edit affordances.
      permissions: ['users.view', 'users.create', 'users.edit', 'users.delete', 'users.manage'],
    }
    return selector ? selector(state) : state
  }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}))

vi.mock('@/hooks/useUsers', () => ({
  useUsers: () => ({
    data: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 },
    isLoading: false,
  }),
  useRoles: () => ({ data: [], isLoading: false }),
  useCreateUser: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateUser: () => ({ mutate: vi.fn(), isPending: false }),
  useChangePassword: () => ({ mutate: vi.fn(), isPending: false }),
  useToggleStatus: () => ({ mutate: vi.fn(), isPending: false }),
  useUnlockAccount: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteUser: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/hooks/useUniversities', () => ({
  useUniversities: () => ({ data: { content: [], totalElements: 0 }, isLoading: false }),
}))

import UsersPage from '../UsersPage'

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the search input', () => {
    render(<UsersPage />)
    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument()
  })

  it('renders the role and status filter selects', () => {
    render(<UsersPage />)
    expect(screen.getByText('All roles')).toBeInTheDocument()
    expect(screen.getByText('All statuses')).toBeInTheDocument()
  })

  it('renders the create-user toolbar action when admin has create permission', () => {
    render(<UsersPage />)
    // The toolbar button labels itself with a generic "Add" key (Plus icon).
    expect(screen.getAllByText('Add').length).toBeGreaterThan(0)
  })
})
