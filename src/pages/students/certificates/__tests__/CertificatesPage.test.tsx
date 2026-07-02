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

vi.mock('@/api/certificates.api', () => ({
  certificatesApi: {
    list: vi.fn().mockResolvedValue({
      content: [
        {
          id: 'C001',
          studentName: 'Alan Turing',
          universityCode: 'U001',
          universityName: 'Test University',
          certificateType: 'IELTS',
          certificateTypeName: 'IELTS',
          certificateName: 'CN-1',
          certificateNameLabel: 'English',
          serialNumber: 'SN-777',
          issueDate: '2024-01-15',
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
      certificateTypes: [{ code: 'IELTS', name: 'IELTS' }],
    }),
    export: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'text/csv' })),
  },
}))

vi.mock('@/lib/queryKeys', () => ({
  queryKeys: {
    certificates: {
      all: ['certificates'],
      list: (filters?: Record<string, unknown>) => ['certificates', 'list', filters],
      byId: (id: string) => ['certificates', id],
      dictionaries: ['certificates', 'dictionaries'],
    },
  },
}))

vi.mock('../CertificateDetailDrawer', () => ({
  default: ({ certificateId, onClose }: { certificateId: string; onClose: () => void }) => (
    <div data-testid="certificate-detail-drawer">
      Certificate Detail: {certificateId}
      <button data-testid="close-drawer-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}))

import CertificatesPage from '../CertificatesPage'
import { certificatesApi } from '@/api/certificates.api'

describe('CertificatesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the search input', async () => {
    render(<CertificatesPage />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    })
  })

  it('renders the table column headers', async () => {
    render(<CertificatesPage />)
    await waitFor(() => {
      expect(screen.getByText('Serial number')).toBeInTheDocument()
      expect(screen.getByText('Certificate name')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })
  })

  it('renders Refresh and Export action buttons', async () => {
    render(<CertificatesPage />)
    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument()
      expect(screen.getByText('Export')).toBeInTheDocument()
    })
  })

  it('shows a certificate row from the fixture', async () => {
    render(<CertificatesPage />)
    await waitFor(() => {
      expect(screen.getByText('Alan Turing')).toBeInTheDocument()
      expect(screen.getByText('SN-777')).toBeInTheDocument()
    })
  })

  it('shows the empty state when there are no certificates', async () => {
    ;(certificatesApi.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 20,
      number: 0,
    })
    render(<CertificatesPage />)
    await waitFor(() => {
      expect(screen.getByText('No data found')).toBeInTheDocument()
    })
  })

  it('forwards typed search input characters', async () => {
    const user = userEvent.setup()
    render(<CertificatesPage />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    })
    const searchInput = screen.getByPlaceholderText('Search...') as HTMLInputElement
    await user.type(searchInput, 'SN-777')
    expect(searchInput.value).toBe('SN-777')
  })

  it('triggers the export mutation when Export is clicked', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:http://localhost/test'),
      revokeObjectURL: vi.fn(),
    })
    render(<CertificatesPage />)
    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Export'))
    await waitFor(() => {
      expect(certificatesApi.export).toHaveBeenCalled()
    })
  })
})
