import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'

vi.mock('@/i18n/config', () => ({
  default: {
    t: (key: string) => key,
    language: 'uz',
    changeLanguage: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'uz', changeLanguage: vi.fn(), on: vi.fn(), off: vi.fn() },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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
      permissions: ['admin'],
    }
    return selector ? selector(state) : state
  }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}))

vi.mock('@/utils/error.util', () => ({
  extractApiErrorMessage: vi.fn((_err: unknown, fallback: string) => fallback),
}))

vi.mock('@/api/scientificProjects.api', () => ({
  scientificProjectsApi: {
    list: vi.fn().mockResolvedValue({
      content: [
        {
          id: 'P001',
          name: 'Nano research',
          projectNumber: 'PN-100',
          universityCode: 'U001',
          universityName: 'Test University',
          projectTypeName: 'Fundamental',
          contractNumber: 'CN-200',
          startDate: '2023-01-01',
          active: true,
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
    }),
    getById: vi.fn().mockResolvedValue(null),
    getDictionaries: vi.fn().mockResolvedValue({
      universities: [{ code: 'U001', name: 'Test University' }],
      projectTypes: [{ code: 'PT1', name: 'Fundamental' }],
    }),
    export: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'text/csv' })),
  },
}))

vi.mock('@/lib/queryKeys', () => ({
  queryKeys: {
    scientificProjects: {
      all: ['scientific-projects'],
      list: (filters?: Record<string, unknown>) => ['scientific-projects', 'list', filters],
      byId: (id: string) => ['scientific-projects', id],
      dictionaries: ['scientific-projects', 'dictionaries'],
    },
  },
}))

vi.mock('../ScientificProjectDetailDrawer', () => ({
  default: ({ projectId, onClose }: { projectId: string; onClose: () => void }) => (
    <div data-testid="project-detail-drawer">
      Project Detail: {projectId}
      <button data-testid="close-drawer-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}))

import ScientificProjectsPage from '../ScientificProjectsPage'
import { scientificProjectsApi } from '@/api/scientificProjects.api'

describe('ScientificProjectsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the search input', async () => {
    render(<ScientificProjectsPage />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    })
  })

  it('renders the table column headers', async () => {
    render(<ScientificProjectsPage />)
    await waitFor(() => {
      expect(screen.getByText('Project number')).toBeInTheDocument()
      expect(screen.getByText('Contract number')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })
  })

  it('renders Refresh and Export action buttons', async () => {
    render(<ScientificProjectsPage />)
    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument()
      expect(screen.getByText('Export')).toBeInTheDocument()
    })
  })

  it('shows a project row from the fixture', async () => {
    render(<ScientificProjectsPage />)
    await waitFor(() => {
      expect(screen.getByText('Nano research')).toBeInTheDocument()
      expect(screen.getByText('PN-100')).toBeInTheDocument()
    })
  })

  it('shows the empty state when there are no projects', async () => {
    ;(scientificProjectsApi.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 20,
      number: 0,
    })
    render(<ScientificProjectsPage />)
    await waitFor(() => {
      expect(screen.getByText('No data found')).toBeInTheDocument()
    })
  })

  it('forwards typed search input characters', async () => {
    const user = userEvent.setup()
    render(<ScientificProjectsPage />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    })
    const searchInput = screen.getByPlaceholderText('Search...') as HTMLInputElement
    await user.type(searchInput, 'Nano')
    expect(searchInput.value).toBe('Nano')
  })

  it('triggers the export mutation when Export is clicked', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:http://localhost/test'),
      revokeObjectURL: vi.fn(),
    })
    render(<ScientificProjectsPage />)
    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Export'))
    await waitFor(() => {
      expect(scientificProjectsApi.export).toHaveBeenCalled()
    })
  })
})
