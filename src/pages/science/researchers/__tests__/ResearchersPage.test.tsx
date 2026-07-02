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

vi.mock('@/api/researchers.api', () => ({
  researchersApi: {
    list: vi.fn().mockResolvedValue({
      content: [
        {
          id: 'R001',
          fullName: 'Ali Valiev',
          studentIdNumber: 'SID-100',
          universityCode: 'U001',
          universityName: 'Test University',
          scienceBranchName: 'Physics',
          doctoralStudentTypeName: 'PhD',
          statusName: 'Studying',
          acceptedDate: '2023-09-01',
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
      scienceBranches: [{ code: 'SB1', name: 'Physics' }],
      doctoralStudentTypes: [{ code: 'DT1', name: 'PhD' }],
      statuses: [{ code: 'ST1', name: 'Studying' }],
    }),
    export: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'text/csv' })),
  },
}))

vi.mock('@/lib/queryKeys', () => ({
  queryKeys: {
    researchers: {
      all: ['researchers'],
      list: (filters?: Record<string, unknown>) => ['researchers', 'list', filters],
      byId: (id: string) => ['researchers', id],
      dictionaries: ['researchers', 'dictionaries'],
    },
  },
}))

vi.mock('../ResearcherDetailDrawer', () => ({
  default: ({ researcherId, onClose }: { researcherId: string; onClose: () => void }) => (
    <div data-testid="researcher-detail-drawer">
      Researcher Detail: {researcherId}
      <button data-testid="close-drawer-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}))

import ResearchersPage from '../ResearchersPage'
import { researchersApi } from '@/api/researchers.api'

describe('ResearchersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the search input', async () => {
    render(<ResearchersPage />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    })
  })

  it('renders the table column headers', async () => {
    render(<ResearchersPage />)
    await waitFor(() => {
      expect(screen.getByText('Full name')).toBeInTheDocument()
      expect(screen.getByText('Student ID number')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })
  })

  it('renders Refresh and Export action buttons', async () => {
    render(<ResearchersPage />)
    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument()
      expect(screen.getByText('Export')).toBeInTheDocument()
    })
  })

  it('shows a researcher row from the fixture', async () => {
    render(<ResearchersPage />)
    await waitFor(() => {
      expect(screen.getByText('Ali Valiev')).toBeInTheDocument()
      expect(screen.getByText('SID-100')).toBeInTheDocument()
    })
  })

  it('shows the empty state when there are no researchers', async () => {
    ;(researchersApi.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 20,
      number: 0,
    })
    render(<ResearchersPage />)
    await waitFor(() => {
      expect(screen.getByText('No data found')).toBeInTheDocument()
    })
  })

  it('forwards typed search input characters', async () => {
    const user = userEvent.setup()
    render(<ResearchersPage />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    })
    const searchInput = screen.getByPlaceholderText('Search...') as HTMLInputElement
    await user.type(searchInput, 'Ali')
    expect(searchInput.value).toBe('Ali')
  })

  it('triggers the export mutation when Export is clicked', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:http://localhost/test'),
      revokeObjectURL: vi.fn(),
    })
    render(<ResearchersPage />)
    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Export'))
    await waitFor(() => {
      expect(researchersApi.export).toHaveBeenCalled()
    })
  })
})
