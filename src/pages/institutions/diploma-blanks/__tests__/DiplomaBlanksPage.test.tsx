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

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}))

vi.mock('@/utils/error.util', () => ({
  extractApiErrorMessage: vi.fn((_err: unknown, fallback: string) => fallback),
}))

vi.mock('@/api/diplomaBlanks.api', () => {
  const row = {
    id: 'b1',
    blankCode: 'BC-100',
    series: 'AB',
    number: '000123',
    universityCode: 'U001',
    universityName: 'Test University',
    blankType: 'BACHELOR',
    statusCode: 'ACTIVE',
    receivedDate: '2024-06-01',
    issuedDate: null,
    academicYear: '2024-2025',
    active: true,
  }
  return {
    diplomaBlanksApi: {
      list: vi.fn().mockResolvedValue({
        content: [row],
        totalElements: 1,
        totalPages: 1,
        size: 20,
        number: 0,
      }),
      getById: vi.fn().mockResolvedValue({
        ...row,
        supplier: 'Goznak',
        batchNumber: 'BN-1',
        statusReason: null,
      }),
      getDictionaries: vi.fn().mockResolvedValue({
        universities: [{ code: 'U001', name: 'Test University' }],
        statuses: [{ code: 'ACTIVE', name: 'ACTIVE' }],
      }),
      export: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'text/csv' })),
    },
  }
})

vi.mock('../DiplomaBlankDetailDrawer', () => ({
  default: ({ diplomaBlankId, onClose }: { diplomaBlankId: string; onClose: () => void }) => (
    <div data-testid="detail-drawer">
      {diplomaBlankId}
      <button onClick={onClose}>Close</button>
    </div>
  ),
}))

import DiplomaBlanksPage from '../DiplomaBlanksPage'
import { diplomaBlanksApi } from '@/api/diplomaBlanks.api'

describe('DiplomaBlanksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the search input', async () => {
    render(<DiplomaBlanksPage />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    })
  })

  it('renders the table column headers', async () => {
    render(<DiplomaBlanksPage />)
    await waitFor(() => {
      expect(screen.getByText('Blank code')).toBeInTheDocument()
      expect(screen.getByText('Received date')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })
  })

  it('shows a fixture row', async () => {
    render(<DiplomaBlanksPage />)
    await waitFor(() => {
      expect(screen.getByText('BC-100')).toBeInTheDocument()
      expect(screen.getByText('Test University')).toBeInTheDocument()
    })
  })

  it('opens the detail drawer from a row action', async () => {
    const user = userEvent.setup()
    render(<DiplomaBlanksPage />)
    await waitFor(() => {
      expect(screen.getByText('BC-100')).toBeInTheDocument()
    })
    await user.click(screen.getByText('View'))
    await waitFor(() => {
      expect(screen.getByTestId('detail-drawer')).toBeInTheDocument()
    })
  })

  it('shows the empty state when there are no rows', async () => {
    ;(diplomaBlanksApi.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 20,
      number: 0,
    })
    render(<DiplomaBlanksPage />)
    await waitFor(() => {
      expect(screen.getByText('No diploma blanks have been added yet')).toBeInTheDocument()
    })
  })

  it('triggers the export mutation when Export is clicked', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:http://localhost/test'),
      revokeObjectURL: vi.fn(),
    })
    render(<DiplomaBlanksPage />)
    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Export'))
    await waitFor(() => {
      expect(diplomaBlanksApi.export).toHaveBeenCalled()
    })
  })
})
