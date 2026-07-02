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

vi.mock('@/api/publications.api', () => ({
  publicationsApi: {
    list: vi.fn().mockResolvedValue({
      content: [
        {
          id: 'PUB001',
          name: 'Deep learning study',
          authors: 'A. Karimov',
          sourceName: 'Nature',
          issueYear: '2023',
          universityCode: 'U001',
          universityName: 'Test University',
          publicationTypeName: 'Article',
          doi: '10.1000/xyz',
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
      publicationTypes: [{ code: 'PT1', name: 'Article' }],
    }),
    export: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'text/csv' })),
  },
}))

vi.mock('@/lib/queryKeys', () => ({
  queryKeys: {
    publications: {
      all: ['publications'],
      list: (filters?: Record<string, unknown>) => ['publications', 'list', filters],
      byId: (id: string) => ['publications', id],
      dictionaries: ['publications', 'dictionaries'],
    },
  },
}))

vi.mock('../PublicationDetailDrawer', () => ({
  default: ({ publicationId, onClose }: { publicationId: string; onClose: () => void }) => (
    <div data-testid="publication-detail-drawer">
      Publication Detail: {publicationId}
      <button data-testid="close-drawer-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}))

import PublicationsPage from '../PublicationsPage'
import { publicationsApi } from '@/api/publications.api'

describe('PublicationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the search input', async () => {
    render(<PublicationsPage />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    })
  })

  it('renders the table column headers', async () => {
    render(<PublicationsPage />)
    await waitFor(() => {
      expect(screen.getByText('Authors')).toBeInTheDocument()
      expect(screen.getByText('Source')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })
  })

  it('renders Refresh and Export action buttons', async () => {
    render(<PublicationsPage />)
    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument()
      expect(screen.getByText('Export')).toBeInTheDocument()
    })
  })

  it('shows a publication row from the fixture', async () => {
    render(<PublicationsPage />)
    await waitFor(() => {
      expect(screen.getByText('Deep learning study')).toBeInTheDocument()
      expect(screen.getByText('A. Karimov')).toBeInTheDocument()
    })
  })

  it('shows the empty state when there are no publications', async () => {
    ;(publicationsApi.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 20,
      number: 0,
    })
    render(<PublicationsPage />)
    await waitFor(() => {
      expect(screen.getByText('No data found')).toBeInTheDocument()
    })
  })

  it('forwards typed search input characters', async () => {
    const user = userEvent.setup()
    render(<PublicationsPage />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    })
    const searchInput = screen.getByPlaceholderText('Search...') as HTMLInputElement
    await user.type(searchInput, 'Deep')
    expect(searchInput.value).toBe('Deep')
  })

  it('triggers the export mutation when Export is clicked', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:http://localhost/test'),
      revokeObjectURL: vi.fn(),
    })
    render(<PublicationsPage />)
    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Export'))
    await waitFor(() => {
      expect(publicationsApi.export).toHaveBeenCalled()
    })
  })
})
