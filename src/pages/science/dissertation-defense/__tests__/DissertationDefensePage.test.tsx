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

vi.mock('@/api/dissertationDefense.api', () => ({
  dissertationDefenseApi: {
    list: vi.fn().mockResolvedValue({
      content: [
        {
          id: 'DD001',
          studentName: 'Aziz Rustamov',
          universityCode: 'U001',
          universityName: 'Test University',
          diplomaNumber: 'DN-500',
          registerNumber: 'RN-600',
          defenseDate: '2023-05-10',
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
    }),
    export: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'text/csv' })),
  },
}))

vi.mock('../DissertationDefenseDetailDrawer', () => ({
  default: ({ defenseId, onClose }: { defenseId: string; onClose: () => void }) => (
    <div data-testid="dissertation-defense-detail-drawer">
      Detail: {defenseId}
      <button data-testid="close-drawer-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}))

import DissertationDefensePage from '../DissertationDefensePage'
import { dissertationDefenseApi } from '@/api/dissertationDefense.api'

describe('DissertationDefensePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the search input', async () => {
    render(<DissertationDefensePage />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    })
  })

  it('renders the table column headers', async () => {
    render(<DissertationDefensePage />)
    await waitFor(() => {
      expect(screen.getByText('Defense date')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })
  })

  it('shows a defense row from the fixture', async () => {
    render(<DissertationDefensePage />)
    await waitFor(() => {
      expect(screen.getByText('Aziz Rustamov')).toBeInTheDocument()
      expect(screen.getByText('DN-500')).toBeInTheDocument()
    })
  })

  it('shows the empty state when there are no rows', async () => {
    ;(dissertationDefenseApi.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 20,
      number: 0,
    })
    render(<DissertationDefensePage />)
    await waitFor(() => {
      expect(screen.getByText('No data found')).toBeInTheDocument()
    })
  })

  it('triggers the export mutation when Export is clicked', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:http://localhost/test'),
      revokeObjectURL: vi.fn(),
    })
    render(<DissertationDefensePage />)
    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Export'))
    await waitFor(() => {
      expect(dissertationDefenseApi.export).toHaveBeenCalled()
    })
  })
})
