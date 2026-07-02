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

vi.mock('@/api/methodical.api', () => ({
  methodicalApi: {
    list: vi.fn().mockResolvedValue({
      content: [
        {
          id: 'M001',
          name: 'Physics manual',
          authors: 'B. Toshev',
          publisher: 'University Press',
          issueYear: '2022',
          sourceName: 'Internal',
          universityCode: 'U001',
          universityName: 'Test University',
          methodicalTypeName: 'Manual',
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
      methodicalTypes: [{ code: 'MT1', name: 'Manual' }],
    }),
    export: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'text/csv' })),
  },
}))

vi.mock('@/lib/queryKeys', () => ({
  queryKeys: {
    methodical: {
      all: ['methodical'],
      list: (filters?: Record<string, unknown>) => ['methodical', 'list', filters],
      byId: (id: string) => ['methodical', id],
      dictionaries: ['methodical', 'dictionaries'],
    },
  },
}))

vi.mock('../MethodicalDetailDrawer', () => ({
  default: ({ methodicalId, onClose }: { methodicalId: string; onClose: () => void }) => (
    <div data-testid="methodical-detail-drawer">
      Methodical Detail: {methodicalId}
      <button data-testid="close-drawer-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}))

import MethodicalPage from '../MethodicalPage'
import { methodicalApi } from '@/api/methodical.api'

describe('MethodicalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the search input', async () => {
    render(<MethodicalPage />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    })
  })

  it('renders the table column headers', async () => {
    render(<MethodicalPage />)
    await waitFor(() => {
      expect(screen.getByText('Publisher')).toBeInTheDocument()
      expect(screen.getByText('Authors')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })
  })

  it('renders Refresh and Export action buttons', async () => {
    render(<MethodicalPage />)
    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument()
      expect(screen.getByText('Export')).toBeInTheDocument()
    })
  })

  it('shows a methodical row from the fixture', async () => {
    render(<MethodicalPage />)
    await waitFor(() => {
      expect(screen.getByText('Physics manual')).toBeInTheDocument()
      expect(screen.getByText('University Press')).toBeInTheDocument()
    })
  })

  it('shows the empty state when there are no methodical works', async () => {
    ;(methodicalApi.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 20,
      number: 0,
    })
    render(<MethodicalPage />)
    await waitFor(() => {
      expect(screen.getByText('No data found')).toBeInTheDocument()
    })
  })

  it('forwards typed search input characters', async () => {
    const user = userEvent.setup()
    render(<MethodicalPage />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    })
    const searchInput = screen.getByPlaceholderText('Search...') as HTMLInputElement
    await user.type(searchInput, 'Physics')
    expect(searchInput.value).toBe('Physics')
  })

  it('triggers the export mutation when Export is clicked', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:http://localhost/test'),
      revokeObjectURL: vi.fn(),
    })
    render(<MethodicalPage />)
    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Export'))
    await waitFor(() => {
      expect(methodicalApi.export).toHaveBeenCalled()
    })
  })
})
