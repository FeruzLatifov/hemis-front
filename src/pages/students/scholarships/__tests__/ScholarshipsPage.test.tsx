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

vi.mock('@/api/scholarships.api', () => ({
  scholarshipsApi: {
    list: vi.fn().mockResolvedValue({
      content: [
        {
          id: 'S001',
          studentName: 'Jane Roe',
          universityCode: 'U001',
          universityName: 'Test University',
          stipendCategory: 'State',
          stipendType: 'Regular',
          decree: 'DCR-9',
          startDate: '2024-09-01',
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
      educationYears: [{ code: '2024', name: '2024-2025' }],
    }),
    export: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'text/csv' })),
  },
}))

vi.mock('@/lib/queryKeys', () => ({
  queryKeys: {
    scholarships: {
      all: ['scholarships'],
      list: (filters?: Record<string, unknown>) => ['scholarships', 'list', filters],
      byId: (id: string) => ['scholarships', id],
      dictionaries: ['scholarships', 'dictionaries'],
    },
  },
}))

vi.mock('../ScholarshipDetailDrawer', () => ({
  default: ({ scholarshipId, onClose }: { scholarshipId: string; onClose: () => void }) => (
    <div data-testid="scholarship-detail-drawer">
      Scholarship Detail: {scholarshipId}
      <button data-testid="close-drawer-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}))

import ScholarshipsPage from '../ScholarshipsPage'
import { scholarshipsApi } from '@/api/scholarships.api'

describe('ScholarshipsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the search input', async () => {
    render(<ScholarshipsPage />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    })
  })

  it('renders the table column headers', async () => {
    render(<ScholarshipsPage />)
    await waitFor(() => {
      expect(screen.getByText('Scholarship category')).toBeInTheDocument()
      expect(screen.getByText('Scholarship type')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })
  })

  it('renders Refresh and Export action buttons', async () => {
    render(<ScholarshipsPage />)
    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument()
      expect(screen.getByText('Export')).toBeInTheDocument()
    })
  })

  it('shows a scholarship row from the fixture', async () => {
    render(<ScholarshipsPage />)
    await waitFor(() => {
      expect(screen.getByText('Jane Roe')).toBeInTheDocument()
      expect(screen.getByText('DCR-9')).toBeInTheDocument()
    })
  })

  it('shows the empty state when there are no scholarships', async () => {
    ;(scholarshipsApi.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 20,
      number: 0,
    })
    render(<ScholarshipsPage />)
    await waitFor(() => {
      expect(screen.getByText('No data found')).toBeInTheDocument()
    })
  })

  it('forwards typed search input characters', async () => {
    const user = userEvent.setup()
    render(<ScholarshipsPage />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    })
    const searchInput = screen.getByPlaceholderText('Search...') as HTMLInputElement
    await user.type(searchInput, 'Jane')
    expect(searchInput.value).toBe('Jane')
  })

  it('triggers the export mutation when Export is clicked', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:http://localhost/test'),
      revokeObjectURL: vi.fn(),
    })
    render(<ScholarshipsPage />)
    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Export'))
    await waitFor(() => {
      expect(scholarshipsApi.export).toHaveBeenCalled()
    })
  })
})
