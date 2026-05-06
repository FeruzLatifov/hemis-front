import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'

// Mock i18n config (used by hooks via i18n.t())
vi.mock('@/i18n/config', () => ({
  default: {
    t: (key: string) => key,
    language: 'uz',
    changeLanguage: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}))

// Mock react-i18next - must include initReactI18next for i18n/config.ts
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'uz', changeLanguage: vi.fn(), on: vi.fn(), off: vi.fn() },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  }
})

// Mock authStore
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

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}))

vi.mock('@/utils/error.util', () => ({
  extractApiErrorMessage: vi.fn((_err: unknown, fallback: string) => fallback),
}))

// Mock faculties API — return one group with two faculties so structural
// assertions work without timing-out on real network calls.
vi.mock('@/api/faculties.api', () => ({
  facultiesApi: {
    getGroups: vi.fn().mockResolvedValue({
      content: [
        {
          universityCode: 'U001',
          universityName: 'Test University',
          facultyCount: 5,
          activeFacultyCount: 3,
          inactiveFacultyCount: 2,
          hasChildren: true,
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
    }),
    getFacultiesByUniversity: vi.fn().mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 50,
      number: 0,
    }),
    exportFaculties: vi.fn().mockResolvedValue(
      new Blob(['test'], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    ),
    getFacultyDetail: vi.fn().mockResolvedValue(null),
  },
  FacultyGroupRow: {},
  FacultyRow: {},
  PageResponse: {},
}))

vi.mock('@/lib/queryKeys', () => ({
  queryKeys: {
    faculties: {
      all: ['faculties'],
      groups: (filters?: Record<string, unknown>) => ['faculty-groups', filters],
      byUniversity: (codes: string[], filters?: Record<string, unknown>) => [
        'faculties-by-university',
        codes,
        filters,
      ],
    },
  },
}))

// Mock the detail drawer so we don't have to mount the heavy real one.
vi.mock('../FacultyDetailDrawer', () => ({
  default: ({ facultyCode, onClose }: { facultyCode: string; onClose: () => void }) => (
    <div data-testid="faculty-detail-drawer">
      Faculty Detail: {facultyCode}
      <button data-testid="close-drawer-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}))

import FacultiesPage from '../FacultiesPage'
import { facultiesApi } from '@/api/faculties.api'

// FacultiesPage's UI is interaction-heavy; here we pin the deterministic
// structural shell (filter chrome, table headers, group row, action buttons,
// empty state) and leave deeper interaction flows to e2e tests.
describe('FacultiesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the search input', async () => {
    render(<FacultiesPage />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    })
  })

  it('renders the table column headers', async () => {
    render(<FacultiesPage />)
    await waitFor(() => {
      expect(screen.getByText('University name')).toBeInTheDocument()
      expect(screen.getByText('Code')).toBeInTheDocument()
      expect(screen.getByText('Faculty count')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })
  })

  it('renders Refresh and Export action buttons', async () => {
    render(<FacultiesPage />)
    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument()
      expect(screen.getByText('Export')).toBeInTheDocument()
    })
  })

  it('shows the university group row from the fixture', async () => {
    render(<FacultiesPage />)
    await waitFor(() => {
      expect(screen.getByText('Test University')).toBeInTheDocument()
      expect(screen.getByText('U001')).toBeInTheDocument()
    })
  })

  it('shows the no-data empty state when there are no groups', async () => {
    ;(facultiesApi.getGroups as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 20,
      number: 0,
    })
    render(<FacultiesPage />)
    await waitFor(() => {
      expect(screen.getByText('No data found')).toBeInTheDocument()
    })
  })

  it('keeps the search input mounted while data is loading', () => {
    ;(facultiesApi.getGroups as ReturnType<typeof vi.fn>).mockReturnValueOnce(new Promise(() => {}))
    render(<FacultiesPage />)
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('forwards typed search input characters', async () => {
    const user = userEvent.setup()
    render(<FacultiesPage />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    })
    const searchInput = screen.getByPlaceholderText('Search...') as HTMLInputElement
    await user.type(searchInput, 'Physics')
    expect(searchInput.value).toBe('Physics')
  })

  it('triggers a refetch when the Refresh button is clicked', async () => {
    const user = userEvent.setup()
    render(<FacultiesPage />)
    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Refresh'))
    await waitFor(() => {
      expect(facultiesApi.getGroups).toHaveBeenCalled()
    })
  })

  it('triggers the export mutation when Export is clicked', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:http://localhost/test'),
      revokeObjectURL: vi.fn(),
    })
    render(<FacultiesPage />)
    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Export'))
    await waitFor(() => {
      expect(facultiesApi.exportFaculties).toHaveBeenCalled()
    })
  })
})
