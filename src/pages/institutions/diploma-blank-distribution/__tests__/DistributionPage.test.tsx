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

// Full permission set so create/edit/delete controls render.
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector?: (state: Record<string, unknown>) => unknown) => {
    const state = {
      isAuthenticated: true,
      user: { name: 'Admin', locale: 'uz' },
      permissions: [
        'institutions.diploma-blank-distribution.view',
        'institutions.diploma-blank-distribution.create',
        'institutions.diploma-blank-distribution.edit',
        'institutions.diploma-blank-distribution.delete',
      ],
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

vi.mock('@/api/diplomaBlankDistribution.api', () => {
  const row = {
    id: 'd1',
    universityCode: 'U001',
    universityName: 'Test University',
    educationYear: '2024',
    educationYearName: '2024-2025',
    educationType: 'ET1',
    educationTypeName: 'Bakalavriat',
    blankCategory: 'C1',
    blankCategoryName: 'Diplom',
    blankSeria: 'AB',
    blankStartNumber: 100,
    blankEndNumber: 200,
    quantity: 101,
    generateStatusCode: 'NEW',
    generateStatusName: 'New',
    distributionDate: '2024-06-30',
    note: 'Test note',
  }
  return {
    diplomaBlankDistributionApi: {
      list: vi.fn().mockResolvedValue({
        content: [row],
        totalElements: 1,
        totalPages: 1,
        size: 20,
        number: 0,
      }),
      getById: vi.fn().mockResolvedValue({ ...row, createdAt: '2026-01-01T00:00:00Z' }),
      create: vi.fn().mockResolvedValue({ ...row, id: 'd2' }),
      update: vi.fn().mockResolvedValue(row),
      remove: vi.fn().mockResolvedValue(undefined),
      getDictionaries: vi.fn().mockResolvedValue({
        universities: [{ code: 'U001', name: 'Test University' }],
        educationYears: [{ code: '2024', name: '2024-2025' }],
        educationTypes: [{ code: 'ET1', name: 'Bakalavriat' }],
        blankCategories: [{ code: 'C1', name: 'Diplom' }],
        generateStatuses: [{ code: 'NEW', name: 'New' }],
      }),
      export: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'text/csv' })),
    },
  }
})

// Stub the form dialog (mounts Radix Select internally — needs ResizeObserver).
vi.mock('../DistributionFormDialog', () => ({
  default: ({ open, editing }: { open: boolean; editing?: { id: string } | null }) =>
    open ? (
      <div data-testid="form-dialog">{editing ? 'Edit distribution' : 'Add distribution'}</div>
    ) : null,
}))

vi.mock('../DistributionDetailDrawer', () => ({
  default: ({ distributionId, onClose }: { distributionId: string; onClose: () => void }) => (
    <div data-testid="detail-drawer">
      {distributionId}
      <button onClick={onClose}>Close</button>
    </div>
  ),
}))

import DistributionPage from '../DistributionPage'
import { diplomaBlankDistributionApi } from '@/api/diplomaBlankDistribution.api'

describe('DistributionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the search input', async () => {
    render(<DistributionPage />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    })
  })

  it('renders the table column headers', async () => {
    render(<DistributionPage />)
    await waitFor(() => {
      expect(screen.getByText('Start number')).toBeInTheDocument()
      expect(screen.getByText('End number')).toBeInTheDocument()
      expect(screen.getByText('Quantity')).toBeInTheDocument()
    })
  })

  it('shows a fixture row', async () => {
    render(<DistributionPage />)
    await waitFor(() => {
      expect(screen.getByText('Test University')).toBeInTheDocument()
      expect(screen.getByText('101')).toBeInTheDocument()
    })
  })

  it('renders the Add button when the user has create permission', async () => {
    render(<DistributionPage />)
    await waitFor(() => {
      expect(screen.getByText('Add distribution')).toBeInTheDocument()
    })
  })

  it('opens the create dialog when Add is clicked', async () => {
    const user = userEvent.setup()
    render(<DistributionPage />)
    await waitFor(() => {
      expect(screen.getByText('Add distribution')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Add distribution'))
    await waitFor(() => {
      expect(screen.getAllByText('Add distribution').length).toBeGreaterThan(1)
    })
  })

  it('opens the edit dialog from a row action', async () => {
    const user = userEvent.setup()
    render(<DistributionPage />)
    await waitFor(() => {
      expect(screen.getByText('Test University')).toBeInTheDocument()
    })
    await user.click(screen.getByLabelText('Edit'))
    await waitFor(() => {
      expect(screen.getByText('Edit distribution')).toBeInTheDocument()
    })
  })

  it('shows the empty state when there are no rows', async () => {
    ;(diplomaBlankDistributionApi.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 20,
      number: 0,
    })
    render(<DistributionPage />)
    await waitFor(() => {
      expect(screen.getByText('No distributions have been added yet')).toBeInTheDocument()
    })
  })

  it('triggers the export mutation when Export is clicked', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:http://localhost/test'),
      revokeObjectURL: vi.fn(),
    })
    render(<DistributionPage />)
    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Export'))
    await waitFor(() => {
      expect(diplomaBlankDistributionApi.export).toHaveBeenCalled()
    })
  })
})
