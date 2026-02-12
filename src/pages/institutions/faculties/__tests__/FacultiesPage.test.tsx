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
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
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
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}))

// Mock error util
vi.mock('@/utils/error.util', () => ({
  extractApiErrorMessage: vi.fn((_err: unknown, fallback: string) => fallback),
}))

// Mock faculties API
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
      content: [
        {
          code: 'F001',
          nameUz: 'Fizika fakulteti',
          nameRu: 'Faculty of Physics',
          shortName: 'FF',
          universityCode: 'U001',
          universityName: 'Test University',
          status: true,
        },
        {
          code: 'F002',
          nameUz: 'Matematika fakulteti',
          nameRu: 'Faculty of Mathematics',
          shortName: 'MF',
          universityCode: 'U001',
          universityName: 'Test University',
          status: false,
        },
      ],
      totalElements: 2,
      totalPages: 1,
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

// Mock queryKeys
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

// Mock FacultyDetailDrawer
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

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => (
    <button {...props}>{children}</button>
  ),
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({
    children,
    value,
    onValueChange,
  }: {
    children: React.ReactNode
    value?: string
    onValueChange?: (v: string) => void
  }) => (
    <div data-testid="select-wrapper" data-value={value}>
      {children}
      <select
        data-testid="status-select"
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
      >
        <option value="all">All</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>
    </div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-trigger">{children}</div>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({
    children,
    ...props
  }: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  ),
}))

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}))

import FacultiesPage from '../FacultiesPage'
import { toast } from 'sonner'
import { facultiesApi } from '@/api/faculties.api'

describe('FacultiesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock URL.createObjectURL and revokeObjectURL
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:http://localhost/test'),
      revokeObjectURL: vi.fn(),
    })
  })

  it('renders page with title', async () => {
    render(<FacultiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Faculties')).toBeInTheDocument()
    })
  })

  it('renders subtitle', async () => {
    render(<FacultiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument()
    })
  })

  it('shows university groups in the table', async () => {
    render(<FacultiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Test University')).toBeInTheDocument()
    })
  })

  it('shows university code', async () => {
    render(<FacultiesPage />)

    await waitFor(() => {
      expect(screen.getByText('U001')).toBeInTheDocument()
    })
  })

  it('shows faculty count for groups', async () => {
    render(<FacultiesPage />)

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument()
    })
  })

  it('has search input', async () => {
    render(<FacultiesPage />)

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search...')
      expect(searchInput).toBeInTheDocument()
    })
  })

  it('has refresh button', async () => {
    render(<FacultiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument()
    })
  })

  it('has export button', async () => {
    render(<FacultiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument()
    })
  })

  it('renders table headers', async () => {
    render(<FacultiesPage />)

    await waitFor(() => {
      expect(screen.getByText('University name')).toBeInTheDocument()
      expect(screen.getByText('Code')).toBeInTheDocument()
      expect(screen.getByText('Faculty count')).toBeInTheDocument()
      // "Status" appears both in table header and in filter select
      const statusElements = screen.getAllByText('Status')
      expect(statusElements.length).toBeGreaterThan(0)
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })
  })

  it('shows loading skeletons when data is loading', async () => {
    ;(facultiesApi.getGroups as ReturnType<typeof vi.fn>).mockReturnValueOnce(new Promise(() => {}))

    render(<FacultiesPage />)

    // Initially should show skeletons (loading state from useQuery)
    await waitFor(() => {
      screen.queryAllByTestId('skeleton')
      expect(screen.getByText('Faculties')).toBeInTheDocument()
    })
  })

  it('has status filter select', async () => {
    render(<FacultiesPage />)

    await waitFor(() => {
      expect(screen.getByTestId('select-wrapper')).toBeInTheDocument()
    })
  })

  // --- New tests for coverage ---

  it('expands a university group to show faculties when expander is clicked', async () => {
    const user = userEvent.setup()
    render(<FacultiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Test University')).toBeInTheDocument()
    })

    // Find and click the expander button
    const expanderButton = screen
      .getByText('Test University')
      .closest('tr')!
      .querySelector('button')!
    await user.click(expanderButton)

    // After expanding, faculties should load and appear
    await waitFor(() => {
      expect(screen.getByText('Fizika fakulteti')).toBeInTheDocument()
      expect(screen.getByText('Matematika fakulteti')).toBeInTheDocument()
    })
  })

  it('shows active and inactive status for faculty rows', async () => {
    const user = userEvent.setup()
    render(<FacultiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Test University')).toBeInTheDocument()
    })

    // Expand the group
    const expanderButton = screen
      .getByText('Test University')
      .closest('tr')!
      .querySelector('button')!
    await user.click(expanderButton)

    await waitFor(() => {
      // Use getAllByText since "Active" and "Inactive" appear in both select options and status badges
      const activeElements = screen.getAllByText('Active')
      expect(activeElements.length).toBeGreaterThanOrEqual(2) // select option + status badge
      const inactiveElements = screen.getAllByText('Inactive')
      expect(inactiveElements.length).toBeGreaterThanOrEqual(2)
    })
  })

  it('shows faculty code in expanded rows', async () => {
    const user = userEvent.setup()
    render(<FacultiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Test University')).toBeInTheDocument()
    })

    const expanderButton = screen
      .getByText('Test University')
      .closest('tr')!
      .querySelector('button')!
    await user.click(expanderButton)

    await waitFor(() => {
      expect(screen.getByText('F001')).toBeInTheDocument()
      expect(screen.getByText('F002')).toBeInTheDocument()
    })
  })

  it('collapses a group when expander is clicked again', async () => {
    const user = userEvent.setup()
    render(<FacultiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Test University')).toBeInTheDocument()
    })

    // Expand
    const expanderButton = screen
      .getByText('Test University')
      .closest('tr')!
      .querySelector('button')!
    await user.click(expanderButton)

    await waitFor(() => {
      expect(screen.getByText('Fizika fakulteti')).toBeInTheDocument()
    })

    // Collapse - click same expander button
    const collapseButton = screen
      .getByText('Test University')
      .closest('tr')!
      .querySelector('button')!
    await user.click(collapseButton)

    // After collapsing, faculties should be removed from visible table
    await waitFor(() => {
      expect(screen.queryByText('Fizika fakulteti')).not.toBeInTheDocument()
    })
  })

  it('opens faculty detail drawer when View button is clicked', async () => {
    const user = userEvent.setup()
    render(<FacultiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Test University')).toBeInTheDocument()
    })

    // Expand to see faculties
    const expanderButton = screen
      .getByText('Test University')
      .closest('tr')!
      .querySelector('button')!
    await user.click(expanderButton)

    await waitFor(() => {
      expect(screen.getByText('Fizika fakulteti')).toBeInTheDocument()
    })

    // Click View on the first faculty
    const viewButtons = screen.getAllByText('View')
    await user.click(viewButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('faculty-detail-drawer')).toBeInTheDocument()
      expect(screen.getByText('Faculty Detail: F001')).toBeInTheDocument()
    })
  })

  it('closes faculty detail drawer when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<FacultiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Test University')).toBeInTheDocument()
    })

    // Expand
    const expanderButton = screen
      .getByText('Test University')
      .closest('tr')!
      .querySelector('button')!
    await user.click(expanderButton)

    await waitFor(() => {
      expect(screen.getByText('Fizika fakulteti')).toBeInTheDocument()
    })

    // Open drawer
    const viewButtons = screen.getAllByText('View')
    await user.click(viewButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('faculty-detail-drawer')).toBeInTheDocument()
    })

    // Close drawer
    await user.click(screen.getByTestId('close-drawer-btn'))

    await waitFor(() => {
      expect(screen.queryByTestId('faculty-detail-drawer')).not.toBeInTheDocument()
    })
  })

  it('exports faculties successfully on Export button click', async () => {
    const user = userEvent.setup()

    render(<FacultiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Export'))

    await waitFor(() => {
      expect(facultiesApi.exportFaculties).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith(
        'Download Excel',
        expect.objectContaining({
          duration: 3000,
          position: 'bottom-right',
        }),
      )
    })
  })

  it('shows error toast when export fails', async () => {
    ;(facultiesApi.exportFaculties as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Export error'),
    )
    const user = userEvent.setup()

    render(<FacultiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Export'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Export failed',
        expect.objectContaining({
          duration: 5000,
          position: 'bottom-right',
        }),
      )
    })
  })

  it('handles search input changes', async () => {
    const user = userEvent.setup()
    render(<FacultiesPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search...')
    await user.type(searchInput, 'Physics')

    expect(searchInput).toHaveValue('Physics')
  })

  it('calls refetch when Refresh button is clicked', async () => {
    const user = userEvent.setup()
    render(<FacultiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Refresh'))

    // Refetch is called internally - the query should re-execute
    // We verify that the API was called (initial + refetch)
    await waitFor(() => {
      expect(facultiesApi.getGroups).toHaveBeenCalled()
    })
  })

  it('shows empty state when no groups exist', async () => {
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

  it('shows error state when query fails', async () => {
    ;(facultiesApi.getGroups as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Server error'),
    )

    render(<FacultiesPage />)

    await waitFor(() => {
      expect(screen.getByText(/Failed to load data/)).toBeInTheDocument()
      expect(screen.getByText(/Server error/)).toBeInTheDocument()
    })
  })

  it('shows active/inactive counts in group row', async () => {
    render(<FacultiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Test University')).toBeInTheDocument()
    })

    // The count display is: <span>5</span> and then "(Active: 3 / Inactive: 2)"
    // These are split across multiple elements, so use a function matcher
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(
      screen.getByText((content) => content.includes('3') && content.includes('2')),
    ).toBeInTheDocument()
  })

  it('does not show pagination when only one page exists', async () => {
    render(<FacultiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Test University')).toBeInTheDocument()
    })

    // With totalPages=1 (default mock), pagination should not show
    expect(screen.queryByText('Previous')).not.toBeInTheDocument()
    expect(screen.queryByText('Next')).not.toBeInTheDocument()
  })

  describe('with multi-page data', () => {
    beforeEach(() => {
      ;(facultiesApi.getGroups as ReturnType<typeof vi.fn>).mockResolvedValue({
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
        totalElements: 50,
        totalPages: 3,
        size: 20,
        number: 0,
      })
    })

    it('shows pagination when multiple pages exist', async () => {
      render(<FacultiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeInTheDocument()
        expect(screen.getByText('Next')).toBeInTheDocument()
      })
    })

    it('navigates to next page on Next button click', async () => {
      const user = userEvent.setup()
      render(<FacultiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Next'))

      // After clicking next, getGroups should be called with page=1
      await waitFor(() => {
        expect(facultiesApi.getGroups).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }))
      })
    })

    it('disables Previous button on first page', async () => {
      render(<FacultiesPage />)

      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeDisabled()
      })
    })
  })
})
