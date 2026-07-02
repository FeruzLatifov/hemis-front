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

// Mock react-i18next
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

// Mock authStore — full permission set so create/edit/delete controls render.
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector?: (state: Record<string, unknown>) => unknown) => {
    const state = {
      isAuthenticated: true,
      user: { name: 'Admin', locale: 'uz' },
      permissions: [
        'institutions.attached-specialities.view',
        'institutions.attached-specialities.create',
        'institutions.attached-specialities.edit',
        'institutions.attached-specialities.delete',
      ],
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

vi.mock('@/api/attachedSpecialities.api', () => {
  const row = {
    id: 'a1',
    universityCode: 'U001',
    universityName: 'Test University',
    educationType: 'ET1',
    educationTypeName: 'Bakalavriat',
    educationForm: 'EF1',
    educationFormName: 'Kunduzgi',
    specialityLevel: 'BACHELOR',
    specialityId: 's1',
    specialityName: 'Software Engineering',
    active: true,
  }
  return {
    attachedSpecialitiesApi: {
      list: vi.fn().mockResolvedValue({
        content: [row],
        totalElements: 1,
        totalPages: 1,
        size: 20,
        number: 0,
      }),
      getById: vi.fn().mockResolvedValue({ ...row, createdAt: '2026-01-01T00:00:00Z' }),
      create: vi.fn().mockResolvedValue({ ...row, id: 'a2' }),
      update: vi.fn().mockResolvedValue(row),
      remove: vi.fn().mockResolvedValue(undefined),
      getDictionaries: vi.fn().mockResolvedValue({
        universities: [{ code: 'U001', name: 'Test University' }],
        educationTypes: [{ code: 'ET1', name: 'Bakalavriat' }],
        educationForms: [{ code: 'EF1', name: 'Kunduzgi' }],
        specialities: {
          BACHELOR: [{ id: 's1', name: 'Software Engineering' }],
          MASTER: [],
          ORDINATURA: [],
          DOCTORAL: [],
        },
      }),
      export: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'text/csv' })),
    },
  }
})

// Stub the form dialog (mounts Radix Select internally — needs ResizeObserver,
// not available in jsdom). We only assert that it opens with the right title.
vi.mock('../AttachedSpecialityFormDialog', () => ({
  default: ({ open, editing }: { open: boolean; editing?: { id: string } | null }) =>
    open ? (
      <div data-testid="form-dialog">
        {editing ? 'Edit attached speciality' : 'Add attached speciality'}
      </div>
    ) : null,
}))

// Stub the detail drawer (also mounts heavy UI).
vi.mock('../AttachedSpecialityDetailDrawer', () => ({
  default: ({
    attachedSpecialityId,
    onClose,
  }: {
    attachedSpecialityId: string
    onClose: () => void
  }) => (
    <div data-testid="detail-drawer">
      {attachedSpecialityId}
      <button onClick={onClose}>Close</button>
    </div>
  ),
}))

import AttachedSpecialitiesPage from '../AttachedSpecialitiesPage'
import { attachedSpecialitiesApi } from '@/api/attachedSpecialities.api'

describe('AttachedSpecialitiesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the search input', async () => {
    render(<AttachedSpecialitiesPage />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    })
  })

  it('renders the table column headers', async () => {
    render(<AttachedSpecialitiesPage />)
    await waitFor(() => {
      expect(screen.getByText('University name')).toBeInTheDocument()
      expect(screen.getByText('Speciality level')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })
  })

  it('shows a fixture row', async () => {
    render(<AttachedSpecialitiesPage />)
    await waitFor(() => {
      expect(screen.getByText('Test University')).toBeInTheDocument()
      expect(screen.getByText('Software Engineering')).toBeInTheDocument()
    })
  })

  it('renders the Add button when the user has create permission', async () => {
    render(<AttachedSpecialitiesPage />)
    await waitFor(() => {
      expect(screen.getByText('Add attached speciality')).toBeInTheDocument()
    })
  })

  it('opens the create dialog when Add is clicked', async () => {
    const user = userEvent.setup()
    render(<AttachedSpecialitiesPage />)
    await waitFor(() => {
      expect(screen.getByText('Add attached speciality')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Add attached speciality'))
    // The dialog title reuses the same key; there are now 2 matches (button + title).
    await waitFor(() => {
      expect(screen.getAllByText('Add attached speciality').length).toBeGreaterThan(1)
    })
  })

  it('shows the empty state when there are no rows', async () => {
    ;(attachedSpecialitiesApi.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 20,
      number: 0,
    })
    render(<AttachedSpecialitiesPage />)
    await waitFor(() => {
      expect(screen.getByText('No attached specialities have been added yet')).toBeInTheDocument()
    })
  })

  it('triggers the export mutation when Export is clicked', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:http://localhost/test'),
      revokeObjectURL: vi.fn(),
    })
    render(<AttachedSpecialitiesPage />)
    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Export'))
    await waitFor(() => {
      expect(attachedSpecialitiesApi.export).toHaveBeenCalled()
    })
  })

  it('opens the edit dialog from a row action', async () => {
    const user = userEvent.setup()
    render(<AttachedSpecialitiesPage />)
    await waitFor(() => {
      expect(screen.getByText('Software Engineering')).toBeInTheDocument()
    })
    await user.click(screen.getByLabelText('Edit'))
    await waitFor(() => {
      expect(screen.getByText('Edit attached speciality')).toBeInTheDocument()
    })
  })
})
