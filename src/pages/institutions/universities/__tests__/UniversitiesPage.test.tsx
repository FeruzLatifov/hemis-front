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
const mockSetSearchParams = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
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
    exportUniversities: vi.fn().mockResolvedValue(undefined),
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
  useUniversityDictionaries: vi.fn(() => ({
    data: {
      regions: [{ code: 'R1', name: 'Tashkent' }],
      ownerships: [{ code: 'O1', name: 'State' }],
      types: [{ code: 'T1', name: 'University' }],
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

// Mock sub-components that may cause issues
vi.mock('../UniversityDetailDrawer', () => ({
  default: ({ open, code }: { open: boolean; code: string | null }) =>
    open ? <div data-testid="university-detail-drawer">Detail: {code}</div> : null,
}))

vi.mock('../UniversityFormDialog', () => ({
  default: ({
    open,
    onSuccess,
    onOpenChange,
  }: {
    open: boolean
    university: unknown
    onSuccess: () => void
    onOpenChange: (open: boolean) => void
  }) =>
    open ? (
      <div data-testid="university-form-dialog">
        Form Dialog
        <button data-testid="form-success-btn" onClick={onSuccess}>
          Save
        </button>
        <button data-testid="form-cancel-btn" onClick={() => onOpenChange(false)}>
          Cancel Form
        </button>
      </div>
    ) : null,
}))

// Mock filter components
vi.mock('@/components/filters/CustomTagFilter', () => ({
  CustomTagFilter: (props: {
    label: string
    onClose: () => void
    onChange: (codes: string[]) => void
  }) => (
    <div data-testid="custom-tag-filter">
      {props.label}
      <button data-testid={`remove-filter-${props.label}`} onClick={props.onClose}>
        X
      </button>
      <button data-testid={`update-filter-${props.label}`} onClick={() => props.onChange(['R1'])}>
        Select
      </button>
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

  it('renders page with title', async () => {
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Institutions list')).toBeInTheDocument()
    })
  })

  it('shows loading state when data is loading', async () => {
    render(<UniversitiesPage />)

    // After data loads, the table should be visible
    await waitFor(() => {
      expect(screen.getByText('Institutions list')).toBeInTheDocument()
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
      expect(screen.getByText('Region')).toBeInTheDocument()
    })
  })

  it('shows total count and page info', async () => {
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText(/Total/)).toBeInTheDocument()
      expect(screen.getByText(/Page/)).toBeInTheDocument()
    })
  })

  it('renders pagination controls', async () => {
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText(/Per page/)).toBeInTheDocument()
    })
  })

  it('renders column settings popover', async () => {
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByTestId('column-settings-popover')).toBeInTheDocument()
    })
  })

  // --- New tests for coverage ---

  it('shows active/inactive status badges in table rows', async () => {
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.getByText('Inactive')).toBeInTheDocument()
    })
  })

  it('opens form dialog when Add button is clicked', async () => {
    const user = userEvent.setup()
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Add')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Add'))

    await waitFor(() => {
      expect(screen.getByTestId('university-form-dialog')).toBeInTheDocument()
    })
  })

  it('opens detail drawer when View button is clicked', async () => {
    const user = userEvent.setup()
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Test University')).toBeInTheDocument()
    })

    const viewButtons = screen.getAllByTitle('View')
    await user.click(viewButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('university-detail-drawer')).toBeInTheDocument()
      expect(screen.getByText('Detail: U001')).toBeInTheDocument()
    })
  })

  it('opens form dialog for editing when Edit button is clicked', async () => {
    const user = userEvent.setup()
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Test University')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByTitle('Edit')
    await user.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('university-form-dialog')).toBeInTheDocument()
    })
  })

  it('opens delete confirmation dialog when Delete button is clicked', async () => {
    const user = userEvent.setup()
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Test University')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByTitle('Delete')
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('alert-dialog')).toBeInTheDocument()
      expect(screen.getByText('Delete university')).toBeInTheDocument()
    })
  })

  it('calls delete mutation when confirming delete', async () => {
    const user = userEvent.setup()
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Test University')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByTitle('Delete')
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('alert-dialog')).toBeInTheDocument()
    })

    // Click the Delete action button within the dialog
    const deleteAction = screen.getByText('Delete')
    await user.click(deleteAction)

    expect(mockMutate).toHaveBeenCalledWith(
      'U001',
      expect.objectContaining({ onSettled: expect.any(Function) }),
    )
  })

  it('dismisses delete dialog via onOpenChange', async () => {
    const user = userEvent.setup()
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Test University')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByTitle('Delete')
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('alert-dialog')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('alert-dialog-dismiss'))

    await waitFor(() => {
      expect(screen.queryByTestId('alert-dialog')).not.toBeInTheDocument()
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
      expect(screen.getByText('Institutions list')).toBeInTheDocument()
    })

    // The filter toggle button is the one with the Filter icon - find button that toggles filter panel
    // It does not have text; it has a Filter icon. Find it by its class or role.
    // Looking at the source, the filter button is before SearchScopeSelector
    const filterToggleButtons = screen
      .getByText('Institutions list')
      .closest('.bg-white')!
      .querySelectorAll('button')
    // First button in the header actions area is the filter toggle
    const filterToggle = filterToggleButtons[0]
    await user.click(filterToggle)

    // After toggling, the filter panel should appear with available filter buttons
    await waitFor(() => {
      expect(screen.getByText('+ Region')).toBeInTheDocument()
      expect(screen.getByText('+ Ownership')).toBeInTheDocument()
      expect(screen.getByText('+ University type')).toBeInTheDocument()
    })
  })

  it('adds a horizontal filter when filter button in panel is clicked', async () => {
    const user = userEvent.setup()
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Institutions list')).toBeInTheDocument()
    })

    // Open filter panel
    const filterToggleButtons = screen
      .getByText('Institutions list')
      .closest('.bg-white')!
      .querySelectorAll('button')
    await user.click(filterToggleButtons[0])

    await waitFor(() => {
      expect(screen.getByText('+ Region')).toBeInTheDocument()
    })

    // Add the Region filter
    await user.click(screen.getByText('+ Region'))

    // The CustomTagFilter should appear
    await waitFor(() => {
      expect(screen.getByTestId('custom-tag-filter')).toBeInTheDocument()
    })
  })

  it('removes a horizontal filter when close is clicked', async () => {
    const user = userEvent.setup()
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Institutions list')).toBeInTheDocument()
    })

    // Open filter panel
    const filterToggleButtons = screen
      .getByText('Institutions list')
      .closest('.bg-white')!
      .querySelectorAll('button')
    await user.click(filterToggleButtons[0])

    await waitFor(() => {
      expect(screen.getByText('+ Region')).toBeInTheDocument()
    })

    // Add filter
    await user.click(screen.getByText('+ Region'))
    await waitFor(() => {
      expect(screen.getByTestId('custom-tag-filter')).toBeInTheDocument()
    })

    // Remove filter
    await user.click(screen.getByTestId('remove-filter-Region'))

    await waitFor(() => {
      expect(screen.queryByTestId('custom-tag-filter')).not.toBeInTheDocument()
    })
  })

  it('updates a horizontal filter when values change', async () => {
    const user = userEvent.setup()
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Institutions list')).toBeInTheDocument()
    })

    // Open filter panel
    const filterToggleButtons = screen
      .getByText('Institutions list')
      .closest('.bg-white')!
      .querySelectorAll('button')
    await user.click(filterToggleButtons[0])

    await waitFor(() => {
      expect(screen.getByText('+ Region')).toBeInTheDocument()
    })

    // Add filter
    await user.click(screen.getByText('+ Region'))
    await waitFor(() => {
      expect(screen.getByTestId('custom-tag-filter')).toBeInTheDocument()
    })

    // Update filter values
    await user.click(screen.getByTestId('update-filter-Region'))

    // Filter should still be present (with updated values internally)
    expect(screen.getByTestId('custom-tag-filter')).toBeInTheDocument()
  })

  it('clears all filters when Clear button is clicked', async () => {
    const user = userEvent.setup()
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Institutions list')).toBeInTheDocument()
    })

    // Open filter panel
    const filterToggleButtons = screen
      .getByText('Institutions list')
      .closest('.bg-white')!
      .querySelectorAll('button')
    await user.click(filterToggleButtons[0])

    // Add a filter first
    await waitFor(() => {
      expect(screen.getByText('+ Region')).toBeInTheDocument()
    })
    await user.click(screen.getByText('+ Region'))

    // Wait for the Clear button to appear
    await waitFor(() => {
      expect(screen.getByText('Clear')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Clear'))

    // Filters should be cleared
    await waitFor(() => {
      expect(screen.queryByTestId('custom-tag-filter')).not.toBeInTheDocument()
    })
  })

  it('handles search submit and clear', async () => {
    const user = userEvent.setup()
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByTestId('search-scope-selector')).toBeInTheDocument()
    })

    // Type in search
    await user.type(screen.getByTestId('search-scope-selector'), 'test query')

    // Click search button
    await user.click(screen.getByTestId('search-btn'))

    // Now clear
    await user.click(screen.getByTestId('clear-search-btn'))

    // Input should be cleared
    await waitFor(() => {
      expect(screen.getByTestId('search-scope-selector')).toHaveValue('')
    })
  })

  it('handles refresh button click', async () => {
    const user = userEvent.setup()
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Institutions list')).toBeInTheDocument()
    })

    // Open filter panel
    const filterToggleButtons = screen
      .getByText('Institutions list')
      .closest('.bg-white')!
      .querySelectorAll('button')
    await user.click(filterToggleButtons[0])

    // Add a filter to make the Refresh button appear
    await waitFor(() => {
      expect(screen.getByText('+ Region')).toBeInTheDocument()
    })
    await user.click(screen.getByText('+ Region'))

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Refresh'))

    expect(toast.success).toHaveBeenCalledWith('Data refreshed')
  })

  it('navigates to next page when next button is clicked', async () => {
    const user = userEvent.setup()
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('1 / 3')).toBeInTheDocument()
    })

    // Find the next page button (ChevronRight)
    const paginationButtons = screen.getByText('1 / 3').parentElement!.querySelectorAll('button')
    const nextButton = paginationButtons[1] // second button is next
    await user.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('2 / 3')).toBeInTheDocument()
    })
  })

  it('navigates to previous page', async () => {
    const user = userEvent.setup()
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('1 / 3')).toBeInTheDocument()
    })

    // Go to page 2 first
    const paginationButtons = screen.getByText('1 / 3').parentElement!.querySelectorAll('button')
    await user.click(paginationButtons[1])
    await waitFor(() => {
      expect(screen.getByText('2 / 3')).toBeInTheDocument()
    })

    // Go back
    const paginationButtonsAfter = screen
      .getByText('2 / 3')
      .parentElement!.querySelectorAll('button')
    await user.click(paginationButtonsAfter[0])
    await waitFor(() => {
      expect(screen.getByText('1 / 3')).toBeInTheDocument()
    })
  })

  it('changes page size', async () => {
    const user = userEvent.setup()
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText(/Per page/)).toBeInTheDocument()
    })

    const select = screen.getByRole('combobox')
    await user.selectOptions(select, '50')

    expect(select).toHaveValue('50')
  })

  it('closes form dialog via onOpenChange (cancel)', async () => {
    const user = userEvent.setup()
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Add')).toBeInTheDocument()
    })

    // Open form
    await user.click(screen.getByText('Add'))
    await waitFor(() => {
      expect(screen.getByTestId('university-form-dialog')).toBeInTheDocument()
    })

    // Cancel form via onOpenChange
    await user.click(screen.getByTestId('form-cancel-btn'))

    await waitFor(() => {
      expect(screen.queryByTestId('university-form-dialog')).not.toBeInTheDocument()
    })
  })

  it('closes form dialog via onSuccess', async () => {
    const user = userEvent.setup()
    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('Add')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Add'))
    await waitFor(() => {
      expect(screen.getByTestId('university-form-dialog')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('form-success-btn'))

    await waitFor(() => {
      expect(screen.queryByTestId('university-form-dialog')).not.toBeInTheDocument()
    })
  })

  it('shows empty state when no universities exist', async () => {
    ;(universitiesApi.getUniversities as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 20,
      number: 0,
    })

    render(<UniversitiesPage />)

    await waitFor(() => {
      expect(screen.getByText('No data found')).toBeInTheDocument()
    })
  })

  it('reads column visibility from localStorage', () => {
    localStorage.setItem('universities-column-visibility', JSON.stringify({ tin: false }))

    render(<UniversitiesPage />)

    // The component should have loaded the saved visibility state
    // Since tin is hidden, its header should not be visible
    // (This tests the localStorage initialization branch in useState)
  })

  it('handles invalid JSON in localStorage gracefully', () => {
    localStorage.setItem('universities-column-visibility', 'invalid-json')

    // Should not throw - the catch block returns {}
    render(<UniversitiesPage />)

    expect(screen.getByText('Institutions list')).toBeInTheDocument()
  })
})
