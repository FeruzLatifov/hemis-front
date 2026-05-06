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
      permissions: ['roles.view', 'roles.manage'],
    }
    return selector ? selector(state) : state
  }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}))

vi.mock('@/hooks/useRoles', () => ({
  useRolesList: () => ({
    data: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 },
    isLoading: false,
    refetch: vi.fn(),
  }),
  useRoleById: () => ({ data: undefined, isLoading: false }),
  useAllPermissions: () => ({ data: [], isLoading: false }),
  useCreateRole: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateRole: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteRole: () => ({ mutate: vi.fn(), isPending: false }),
}))

import RolesPage from '../RolesPage'

describe('RolesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the search input', () => {
    render(<RolesPage />)
    expect(screen.getByPlaceholderText('Search roles...')).toBeInTheDocument()
  })

  it('renders the empty-state message when no roles exist', () => {
    render(<RolesPage />)
    expect(screen.getByText('No roles found')).toBeInTheDocument()
  })

  it('renders the create-role action when admin has manage permission', () => {
    render(<RolesPage />)
    expect(screen.getAllByText('Add').length).toBeGreaterThan(0)
  })
})
