import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'

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
const mockNavigate = vi.fn()
const mockSetSearchParams = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), mockSetSearchParams],
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

const mockMutate = vi.fn()

// Mock universities API
vi.mock('@/api/universities.api', () => ({
  universitiesApi: {
    getUniversities: vi.fn().mockResolvedValue({
      content: [
        {
          code: 'U001',
          name: 'Test University',
          tin: '123456789',
          region: 'Tashkent',
          ownership: 'State',
          type: 'University',
          address: '123 Test St',
          cadastre: 'CAD-001',
          active: true,
        },
        {
          code: 'U002',
          name: 'Inactive University',
          tin: '987654321',
          region: 'Samarkand',
          ownership: 'Private',
          type: 'Institute',
          address: '456 Other St',
          cadastre: 'CAD-002',
          active: false,
        },
      ],
      totalElements: 50,
      totalPages: 3,
      size: 20,
      number: 0,
    }),
    exportUniversities: vi.fn().mockResolvedValue([]),
    getDictionaries: vi.fn().mockResolvedValue({
      regions: [{ code: 'R1', name: 'Tashkent' }],
      ownerships: [{ code: 'O1', name: 'State' }],
      types: [{ code: 'T1', name: 'University' }],
    }),
  },
  UniversityRow: {},
}))

// Mock useUniversities hooks
vi.mock('@/hooks/useUniversities', () => ({
  useUniversities: vi.fn(() => ({
    data: {
      content: [
        {
          code: 'U001',
          name: 'Test University',
          tin: '123456789',
          region: 'Tashkent',
          ownership: 'State',
          type: 'University',
          address: '123 Test St',
          cadastre: 'CAD-001',
          active: true,
        },
        {
          code: 'U002',
          name: 'Inactive University',
          tin: '987654321',
          region: 'Samarkand',
          ownership: 'Private',
          type: 'Institute',
          address: '456 Other St',
          cadastre: 'CAD-002',
          active: false,
        },
      ],
      totalElements: 50,
      totalPages: 3,
      size: 20,
      number: 0,
    },
    isLoading: false,
    isPlaceholderData: false,
    refetch: vi.fn(),
  })),
  useUniversityDictionaries: vi.fn(() => ({
    data: {
      regions: [{ code: 'R1', name: 'Tashkent' }],
      ownerships: [{ code: 'O1', name: 'State' }],
      types: [{ code: 'T1', name: 'University' }],
      activityStatuses: [{ code: 'A1', name: 'Active' }],
      belongsToOptions: [{ code: 'B1', name: 'Ministry' }],
      contractCategories: [{ code: 'C1', name: 'Contract' }],
      versionTypes: [{ code: 'V1', name: 'Version 1' }],
      districts: [{ code: 'D1', name: 'District 1' }],
    },
    isLoading: false,
  })),
  useDeleteUniversity: vi.fn(() => ({
    mutate: mockMutate,
    isPending: false,
  })),
  useUniversity: vi.fn(() => ({
    data: null,
    isLoading: false,
    isError: false,
  })),
  useCreateUniversity: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useUpdateUniversity: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}))

// Mock error util
vi.mock('@/utils/error.util', () => ({
  extractApiErrorMessage: vi.fn((_err: unknown, fallback: string) => fallback),
}))

// Mock queryKeys
vi.mock('@/lib/queryKeys', () => ({
  queryKeys: {
    universities: {
      all: ['universities'],
      list: (filters?: Record<string, unknown>) => ['universities', 'list', filters],
      byId: (id: string) => ['universities', id],
      dictionaries: ['universities', 'dictionaries'],
    },
  },
}))

// Mock filter components
vi.mock('@/components/filters/CustomTagFilter', () => ({
  CustomTagFilter: (props: {
    label: string
    data: { code: string; name: string }[]
    value: string[]
    onChange: (codes: string[]) => void
    onClose?: () => void
  }) => (
    <div data-testid="custom-tag-filter">
      <span data-testid={`filter-label-${props.label}`}>{props.label}</span>
      <button data-testid={`update-filter-${props.label}`} onClick={() => props.onChange(['R1'])}>
        Select
      </button>
      {props.value.length > 0 && (
        <button data-testid={`clear-filter-${props.label}`} onClick={() => props.onChange([])}>
          Clear
        </button>
      )}
      {props.onClose && (
        <button data-testid={`remove-filter-${props.label}`} onClick={props.onClose}>
          Remove
        </button>
      )}
    </div>
  ),
}))

vi.mock('@/components/filters/SearchScopeSelector', () => ({
  SearchScopeSelector: (props: {
    searchValue: string
    onSearchChange: (v: string) => void
    onSearch: () => void
    onClear: () => void
  }) => (
    <div>
      <input
        data-testid="search-scope-selector"
        value={props.searchValue}
        onChange={(e) => props.onSearchChange(e.target.value)}
        placeholder="Search..."
      />
      <button data-testid="search-btn" onClick={props.onSearch}>
        Search
      </button>
      <button data-testid="clear-search-btn" onClick={props.onClear}>
        Clear Search
      </button>
    </div>
  ),
}))

vi.mock('@/components/filters/ColumnSettingsPopover', () => ({
  ColumnSettingsPopover: () => <div data-testid="column-settings-popover">Column Settings</div>,
}))

// Mock DataTablePagination
vi.mock('@/components/tables/DataTablePagination', () => ({
  DataTablePagination: ({
    page,
    totalPages,
    totalElements,
    pageSize,
    onPageChange,
    onPageSizeChange,
  }: {
    page: number
    totalPages: number
    totalElements: number
    pageSize: number
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
  }) => (
    <div data-testid="data-table-pagination">
      <div>
        <span>Per page</span>
        <select
          data-testid="page-size-select"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>
      <div>
        <span>Total: {totalElements}</span>
      </div>
      <div>
        <button
          data-testid="prev-page-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
        >
          Previous
        </button>
        <span data-testid="page-info">
          Page {page + 1} / {totalPages}
        </span>
        <button
          data-testid="next-page-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
        >
          Next
        </button>
      </div>
    </div>
  ),
}))

// Mock alert-dialog
vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({
    children,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode
    open: boolean
    onOpenChange?: (open: boolean) => void
  }) =>
    open ? (
      <div data-testid="alert-dialog">
        {children}
        <button data-testid="alert-dialog-dismiss" onClick={() => onOpenChange?.(false)}>
          Dismiss
        </button>
      </div>
    ) : null,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogAction: ({
    children,
    ...props
  }: {
    children: React.ReactNode
    onClick?: () => void
  }) => <button {...props}>{children}</button>,
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}))

import UniversitiesPage from '../UniversitiesPage'
import { toast } from 'sonner'
import { universitiesApi } from '@/api/universities.api'

describe('UniversitiesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders page with toolbar elements', async () => {
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument()
      expect(screen.getByText('Add')).toBeInTheDocument()
      expect(screen.getByText('Excel')).toBeInTheDocument()
    })
  })

  it('shows university data in the table', async () => {
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Test University')).toBeInTheDocument()
    })

    expect(screen.getByText('U001')).toBeInTheDocument()
    expect(screen.getByText('123456789')).toBeInTheDocument()
  })

  it('has a search input', async () => {
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByTestId('search-scope-selector')).toBeInTheDocument()
    })
  })

  it('has an add button', async () => {
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Add')).toBeInTheDocument()
    })
  })

  it('navigates to create page when Add button is clicked', async () => {
    const user = userEvent.setup()
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Add')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Add'))

    expect(mockNavigate).toHaveBeenCalledWith('/institutions/universities/create')
  })

  it('has an Excel export button', async () => {
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Excel')).toBeInTheDocument()
    })
  })

  it('renders table headers', async () => {
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Code')).toBeInTheDocument()
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('INN')).toBeInTheDocument()
      // "Region" appears in both filter label and table header
      expect(screen.getAllByText('Region').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('shows total count in toolbar', async () => {
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getAllByText(/Total/).length).toBeGreaterThanOrEqual(1)
    })
  })

  it('renders pagination controls', async () => {
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByTestId('data-table-pagination')).toBeInTheDocument()
      expect(screen.getByText(/Per page/)).toBeInTheDocument()
    })
  })

  it('renders column settings popover', async () => {
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByTestId('column-settings-popover')).toBeInTheDocument()
    })
  })

  it('shows active/inactive status badges in table rows', async () => {
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.getByText('Inactive')).toBeInTheDocument()
    })
  })

  it('calls handleExport and shows success toast on Excel button click', async () => {
    const user = userEvent.setup()
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Excel')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Excel'))

    await waitFor(() => {
      expect(universitiesApi.exportUniversities).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith('Excel file downloading...')
    })
  })

  it('shows error toast when export fails', async () => {
    ;(universitiesApi.exportUniversities as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network error'),
    )
    const user = userEvent.setup()
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Excel')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Excel'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Export failed')
    })
  })

  it('toggles filter panel when filter button is clicked', async () => {
    const user = userEvent.setup()
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument()
    })

    // Initially, filters should not be visible in DOM (grid-rows-[0fr])
    // After clicking, CustomTagFilter components should appear
    const filterButton = screen.getByText('Filters')
    await user.click(filterButton)

    await waitFor(() => {
      // Check that filter components are now visible
      expect(screen.getByTestId('filter-label-Region')).toBeInTheDocument()
      expect(screen.getByTestId('filter-label-Ownership')).toBeInTheDocument()
      expect(screen.getByTestId('filter-label-Type')).toBeInTheDocument()
    })
  })

  it('renders all filter components when panel is open', async () => {
    const user = userEvent.setup()
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Filters'))

    await waitFor(() => {
      expect(screen.getByTestId('filter-label-Region')).toBeInTheDocument()
      expect(screen.getByTestId('filter-label-Ownership')).toBeInTheDocument()
      expect(screen.getByTestId('filter-label-Type')).toBeInTheDocument()
      expect(screen.getByTestId('filter-label-Activity status')).toBeInTheDocument()
      expect(screen.getByTestId('filter-label-Belongs to')).toBeInTheDocument()
      expect(screen.getByTestId('filter-label-Contract category')).toBeInTheDocument()
      expect(screen.getByTestId('filter-label-HEMIS version')).toBeInTheDocument()
      expect(screen.getByTestId('filter-label-District')).toBeInTheDocument()
      expect(screen.getByTestId('filter-label-Status')).toBeInTheDocument()
    })
  })

  it('updates filter when filter value changes', async () => {
    const user = userEvent.setup()
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Filters'))

    await waitFor(() => {
      expect(screen.getByTestId('update-filter-Region')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('update-filter-Region'))

    // The filter change should trigger URL params update via mockSetSearchParams
    expect(mockSetSearchParams).toHaveBeenCalled()
  })

  it('calls setSearchParams when filter value is selected', async () => {
    const user = userEvent.setup()
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Filters'))

    await waitFor(() => {
      expect(screen.getByTestId('update-filter-Region')).toBeInTheDocument()
    })

    // Select a filter value — this triggers handleFilterChange which calls setSearchParams
    await user.click(screen.getByTestId('update-filter-Region'))

    // Verify setSearchParams was called (filter applied via URL)
    expect(mockSetSearchParams).toHaveBeenCalled()
  })

  it('handles search submit and clear', async () => {
    const user = userEvent.setup()
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByTestId('search-scope-selector')).toBeInTheDocument()
    })

    await user.type(screen.getByTestId('search-scope-selector'), 'test query')

    await user.click(screen.getByTestId('search-btn'))

    await user.click(screen.getByTestId('clear-search-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('search-scope-selector')).toHaveValue('')
    })
  })

  it('handles refresh button click', async () => {
    const user = userEvent.setup()
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByTitle('Refresh')).toBeInTheDocument()
    })

    await user.click(screen.getByTitle('Refresh'))

    expect(toast.success).toHaveBeenCalledWith('Data refreshed')
  })

  it('navigates to next page when next button is clicked', async () => {
    const user = userEvent.setup()
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByTestId('page-info')).toHaveTextContent('Page 1 / 3')
    })

    const nextButton = screen.getByTestId('next-page-btn')
    await user.click(nextButton)

    expect(mockSetSearchParams).toHaveBeenCalled()
  })

  it('has previous page button', async () => {
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByTestId('prev-page-btn')).toBeInTheDocument()
    })

    // At page 0, prev button is disabled
    expect(screen.getByTestId('prev-page-btn')).toBeDisabled()
  })

  it('changes page size', async () => {
    const user = userEvent.setup()
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByTestId('page-size-select')).toBeInTheDocument()
    })

    const select = screen.getByTestId('page-size-select')
    await user.selectOptions(select, '50')

    expect(mockSetSearchParams).toHaveBeenCalled()
  })

  it('shows empty state when no universities exist', async () => {
    const { useUniversities } = await import('@/hooks/useUniversities')
    vi.mocked(useUniversities).mockReturnValueOnce({
      data: {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 20,
        number: 0,
      },
      isLoading: false,
      isPlaceholderData: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useUniversities>)

    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('No data found')).toBeInTheDocument()
    })
  })

  it('reads column visibility from localStorage', () => {
    localStorage.setItem('universities-column-visibility', JSON.stringify({ tin: false }))

    render(<UniversitiesPage />)

    // Component should render without errors
    expect(screen.getByText('Filters')).toBeInTheDocument()
  })

  it('handles invalid JSON in localStorage gracefully', () => {
    localStorage.setItem('universities-column-visibility', 'invalid-json')

    render(<UniversitiesPage />)

    // Component should render without errors and show toolbar
    expect(screen.getByText('Filters')).toBeInTheDocument()
    expect(screen.getByText('Add')).toBeInTheDocument()
  })
})
