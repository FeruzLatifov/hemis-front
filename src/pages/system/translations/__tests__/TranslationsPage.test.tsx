import { render, screen, waitFor, fireEvent, act } from '@/test/test-utils'

const mockNavigate = vi.fn()

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
    useNavigate: () => mockNavigate,
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

// Mock translations API
vi.mock('@/api/translations.api', () => ({
  getTranslations: vi.fn().mockResolvedValue({
    content: [
      {
        id: 'tr-001',
        category: 'menu',
        messageKey: 'Dashboard',
        message: 'Bosh sahifa',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'tr-002',
        category: 'button',
        messageKey: 'Save',
        message: 'Saqlash',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ],
    currentPage: 0,
    totalItems: 2,
    totalPages: 1,
    pageSize: 20,
  }),
  toggleTranslationActive: vi.fn().mockResolvedValue({}),
  clearTranslationCache: vi.fn().mockResolvedValue({ message: 'Cache cleared' }),
  regeneratePropertiesFiles: vi.fn().mockResolvedValue({ totalFiles: 4, totalTranslations: 100 }),
  downloadAllTranslationsAsJson: vi.fn().mockResolvedValue({ downloaded: ['uz', 'ru'] }),
  findDuplicateMessages: vi.fn().mockResolvedValue([]),
  DuplicateGroup: {},
}))

// Mock queryKeys
vi.mock('@/lib/queryKeys', () => ({
  queryKeys: {
    translations: {
      all: ['translations'],
      list: (filters?: Record<string, unknown>) => ['translations', 'list', filters],
      byId: (id: string) => ['translations', id],
    },
  },
}))

// Mock dialog components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? (
      <div data-testid="dialog" role="dialog">
        {children}
      </div>
    ) : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

import TranslationsPage from '../TranslationsPage'
import { toast } from 'sonner'

describe('TranslationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page title', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Manage translations')).toBeInTheDocument()
    })
  })

  it('renders page subtitle', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('View and edit translation key-value pairs')).toBeInTheDocument()
    })
  })

  it('shows translation table with data', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Bosh sahifa')).toBeInTheDocument()
      expect(screen.getByText('Save')).toBeInTheDocument()
      expect(screen.getByText('Saqlash')).toBeInTheDocument()
    })
  })

  it('shows category badges', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('menu')).toBeInTheDocument()
      expect(screen.getByText('button')).toBeInTheDocument()
    })
  })

  it('shows table headers', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      // "Category" appears in both the table header and the filter label
      const categoryElements = screen.getAllByText('Category')
      expect(categoryElements.length).toBeGreaterThan(0)
      expect(screen.getByText('Key')).toBeInTheDocument()
    })
  })

  it('has category filter input', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('menu, button...')).toBeInTheDocument()
    })
  })

  it('has search filter input', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Key or text...')).toBeInTheDocument()
    })
  })

  it('has status filter select', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      const statusLabel = screen.getAllByText('Status')
      expect(statusLabel.length).toBeGreaterThan(0)
    })
  })

  it('has page size select', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Show')).toBeInTheDocument()
    })
  })

  it('has Find duplicates button', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Find duplicates')).toBeInTheDocument()
    })
  })

  it('has Download JSON button', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Download JSON')).toBeInTheDocument()
    })
  })

  it('has Clear cache button', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Clear cache')).toBeInTheDocument()
    })
  })

  it('has Generate properties button', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Generate properties')).toBeInTheDocument()
    })
  })

  it('shows edit buttons for each translation', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      const editButtons = screen.getAllByText('Edit')
      expect(editButtons.length).toBe(2)
    })
  })

  it('shows pagination info', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('items')).toBeInTheDocument()
      expect(screen.getByText('Page')).toBeInTheDocument()
    })
  })

  it('shows Previous and Next pagination buttons', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Previous/)).toBeInTheDocument()
      expect(screen.getByText(/Next/)).toBeInTheDocument()
    })
  })

  it('shows loading state when data is loading', async () => {
    const { getTranslations } = await import('@/api/translations.api')
    ;(getTranslations as ReturnType<typeof vi.fn>).mockReturnValueOnce(new Promise(() => {}))

    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  // ====== NEW TESTS: Error and empty states ======

  it('shows error state when query fails', async () => {
    const { getTranslations } = await import('@/api/translations.api')
    ;(getTranslations as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'))

    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Error/)).toBeInTheDocument()
      expect(screen.getByText(/Network error/)).toBeInTheDocument()
    })
  })

  it('shows empty state when no translations found', async () => {
    const { getTranslations } = await import('@/api/translations.api')
    ;(getTranslations as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      content: [],
      currentPage: 0,
      totalItems: 0,
      totalPages: 0,
      pageSize: 20,
    })

    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('No translations found')).toBeInTheDocument()
    })
  })

  // ====== NEW TESTS: Filter interactions ======

  it('allows typing in category filter', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('menu, button...')).toBeInTheDocument()
    })

    const categoryInput = screen.getByPlaceholderText('menu, button...')
    fireEvent.change(categoryInput, { target: { value: 'menu' } })
    expect((categoryInput as HTMLInputElement).value).toBe('menu')
  })

  it('allows typing in search filter', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Key or text...')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Key or text...')
    fireEvent.change(searchInput, { target: { value: 'Dashboard' } })
    expect((searchInput as HTMLInputElement).value).toBe('Dashboard')
  })

  it('allows changing status filter to Active', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument()
    })

    const selects = screen.getAllByRole('combobox')
    // First select is the status filter
    const statusSelect = selects[0]
    fireEvent.change(statusSelect, { target: { value: 'true' } })
    expect((statusSelect as HTMLSelectElement).value).toBe('true')
  })

  it('allows changing status filter to Inactive', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument()
    })

    const selects = screen.getAllByRole('combobox')
    const statusSelect = selects[0]
    fireEvent.change(statusSelect, { target: { value: 'false' } })
    expect((statusSelect as HTMLSelectElement).value).toBe('false')
  })

  it('allows resetting status filter back to All', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument()
    })

    const selects = screen.getAllByRole('combobox')
    const statusSelect = selects[0]
    // Set to Active first
    fireEvent.change(statusSelect, { target: { value: 'true' } })
    // Then reset to All
    fireEvent.change(statusSelect, { target: { value: '' } })
    expect((statusSelect as HTMLSelectElement).value).toBe('')
  })

  it('allows changing page size', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Show')).toBeInTheDocument()
    })

    const selects = screen.getAllByRole('combobox')
    // Second select is the page size selector
    const pageSizeSelect = selects[1]
    fireEvent.change(pageSizeSelect, { target: { value: '50' } })
    expect((pageSizeSelect as HTMLSelectElement).value).toBe('50')
  })

  // ====== NEW TESTS: Pagination ======

  it('Previous button is disabled on first page', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Previous/)).toBeInTheDocument()
    })

    const prevBtn = screen.getByText(/Previous/)
    expect(prevBtn).toBeDisabled()
  })

  it('Next button is disabled when on last page', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Next/)).toBeInTheDocument()
    })

    // totalPages = 1, currentPage = 0 => on last page
    const nextBtn = screen.getByText(/Next/)
    expect(nextBtn).toBeDisabled()
  })

  it('clicking Next button advances page when not on last page', async () => {
    const { getTranslations } = await import('@/api/translations.api')
    ;(getTranslations as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: [
        {
          id: 'tr-001',
          category: 'menu',
          messageKey: 'Dashboard',
          message: 'Bosh sahifa',
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      currentPage: 0,
      totalItems: 40,
      totalPages: 2,
      pageSize: 20,
    })

    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Next/)).toBeInTheDocument()
    })

    const nextBtn = screen.getByText(/Next/)
    expect(nextBtn).not.toBeDisabled()
    fireEvent.click(nextBtn)

    // After clicking Next, the page number should update
    // The "2" text may appear multiple times (page number and totalPages), so use getAllByText
    await waitFor(() => {
      const twos = screen.getAllByText('2')
      expect(twos.length).toBeGreaterThanOrEqual(2)
    })
  })

  it('clicking Previous button goes to previous page', async () => {
    const { getTranslations } = await import('@/api/translations.api')
    ;(getTranslations as ReturnType<typeof vi.fn>).mockResolvedValue({
      content: [
        {
          id: 'tr-001',
          category: 'menu',
          messageKey: 'Dashboard',
          message: 'Bosh sahifa',
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      currentPage: 0,
      totalItems: 60,
      totalPages: 3,
      pageSize: 20,
    })

    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Next/)).not.toBeDisabled()
    })

    // Go to page 2
    fireEvent.click(screen.getByText(/Next/))

    await waitFor(() => {
      expect(screen.getByText(/Previous/)).not.toBeDisabled()
    })

    // Go back to page 1
    fireEvent.click(screen.getByText(/Previous/))

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })

  // ====== NEW TESTS: Toggle active ======

  it('calls toggleTranslationActive when status button is clicked', async () => {
    const { toggleTranslationActive } = await import('@/api/translations.api')

    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    // The active toggle buttons show checkmark for active translations
    const toggleButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.textContent === '\u2713' || btn.textContent === '\u25CB')
    expect(toggleButtons.length).toBeGreaterThan(0)

    await act(async () => {
      fireEvent.click(toggleButtons[0])
    })

    await waitFor(() => {
      expect(toggleTranslationActive).toHaveBeenCalled()
      expect((toggleTranslationActive as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe('tr-001')
    })
  })

  // ====== NEW TESTS: Edit button navigation ======

  it('navigates to edit page when Edit button is clicked', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByText('Edit')
    fireEvent.click(editButtons[0])

    expect(mockNavigate).toHaveBeenCalledWith('/system/translation/tr-001/edit')
  })

  // ====== NEW TESTS: Clear cache modal ======

  it('opens clear cache modal when Clear cache button is clicked', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Clear cache')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Clear cache'))

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(
        screen.getByText(
          'Do you want to clear translations cache? This will force reload translations from backend.',
        ),
      ).toBeInTheDocument()
    })
  })

  it('closes clear cache modal when Cancel is clicked', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Clear cache')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Clear cache'))

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Cancel'))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('confirms clear cache successfully', async () => {
    const { clearTranslationCache } = await import('@/api/translations.api')

    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Clear cache')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Clear cache'))

    await waitFor(() => {
      expect(screen.getByText('Yes, clear')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Yes, clear'))
    })

    await waitFor(() => {
      expect(clearTranslationCache).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith('Cache cleared', expect.any(Object))
    })
  })

  it('shows error toast when clear cache fails', async () => {
    const { clearTranslationCache } = await import('@/api/translations.api')
    ;(clearTranslationCache as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Server error'),
    )

    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Clear cache')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Clear cache'))

    await waitFor(() => {
      expect(screen.getByText('Yes, clear')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Yes, clear'))
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error clearing cache', expect.any(Object))
    })
  })

  // ====== NEW TESTS: Regenerate properties modal ======

  it('opens regenerate modal when Generate properties button is clicked', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Generate properties')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Generate properties'))

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(
        screen.getByText(
          'Do you want to regenerate properties files for all languages? This may take a few seconds.',
        ),
      ).toBeInTheDocument()
    })
  })

  it('closes regenerate modal when Cancel is clicked', async () => {
    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Generate properties')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Generate properties'))

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // There will be a Cancel button within the dialog
    const cancelButtons = screen.getAllByText('Cancel')
    fireEvent.click(cancelButtons[cancelButtons.length - 1])

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('confirms regenerate properties successfully', async () => {
    const { regeneratePropertiesFiles } = await import('@/api/translations.api')

    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Generate properties')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Generate properties'))

    await waitFor(() => {
      expect(screen.getByText('Yes, generate')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Yes, generate'))
    })

    await waitFor(() => {
      expect(regeneratePropertiesFiles).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('4'), expect.any(Object))
    })
  })

  it('shows error toast when regenerate properties fails', async () => {
    const { regeneratePropertiesFiles } = await import('@/api/translations.api')
    ;(regeneratePropertiesFiles as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Regen error'),
    )

    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Generate properties')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Generate properties'))

    await waitFor(() => {
      expect(screen.getByText('Yes, generate')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Yes, generate'))
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error generating properties', expect.any(Object))
    })
  })

  // ====== NEW TESTS: Download JSON ======

  it('downloads JSON files successfully', async () => {
    const { downloadAllTranslationsAsJson } = await import('@/api/translations.api')

    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Download JSON')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Download JSON'))
    })

    await waitFor(() => {
      expect(downloadAllTranslationsAsJson).toHaveBeenCalled()
      expect(toast.info).toHaveBeenCalledWith('JSON files downloading...', expect.any(Object))
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('JSON files downloaded'),
        expect.any(Object),
      )
    })
  })

  it('shows error toast when download JSON fails', async () => {
    const { downloadAllTranslationsAsJson } = await import('@/api/translations.api')
    ;(downloadAllTranslationsAsJson as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Download failed'),
    )

    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Download JSON')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Download JSON'))
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error downloading JSON', expect.any(Object))
    })
  })

  // ====== NEW TESTS: Find duplicates ======

  it('shows success toast when no duplicates found', async () => {
    const { findDuplicateMessages } = await import('@/api/translations.api')
    ;(findDuplicateMessages as ReturnType<typeof vi.fn>).mockResolvedValueOnce([])

    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Find duplicates')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Find duplicates'))
    })

    await waitFor(() => {
      expect(findDuplicateMessages).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith(
        'No duplicate translations found',
        expect.any(Object),
      )
    })
  })

  it('shows warning toast and duplicates panel when duplicates are found', async () => {
    const { findDuplicateMessages } = await import('@/api/translations.api')
    ;(findDuplicateMessages as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        message: 'Saqlash',
        entries: [
          {
            id: 'tr-002',
            category: 'button',
            messageKey: 'Save',
            message: 'Saqlash',
            isActive: true,
          },
          {
            id: 'tr-003',
            category: 'action',
            messageKey: 'SaveRecord',
            message: 'Saqlash',
            isActive: true,
          },
        ],
      },
    ])

    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Find duplicates')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Find duplicates'))
    })

    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledWith(expect.stringContaining('1'), expect.any(Object))
    })

    // Duplicates panel should appear
    await waitFor(() => {
      expect(screen.getByText(/duplicate groups found/)).toBeInTheDocument()
      expect(screen.getByText('"Saqlash"')).toBeInTheDocument()
    })
  })

  it('shows error toast when find duplicates fails', async () => {
    const { findDuplicateMessages } = await import('@/api/translations.api')
    ;(findDuplicateMessages as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Dup error'),
    )

    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Find duplicates')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Find duplicates'))
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error checking duplicates', expect.any(Object))
    })
  })

  // ====== NEW TESTS: Duplicates panel interactions ======

  it('closes duplicates panel when X button is clicked', async () => {
    const { findDuplicateMessages } = await import('@/api/translations.api')
    ;(findDuplicateMessages as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        message: 'Saqlash',
        entries: [
          {
            id: 'tr-002',
            category: 'button',
            messageKey: 'Save',
            message: 'Saqlash',
            isActive: true,
          },
          {
            id: 'tr-003',
            category: 'action',
            messageKey: 'SaveRecord',
            message: 'Saqlash',
            isActive: true,
          },
        ],
      },
    ])

    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Find duplicates')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Find duplicates'))
    })

    await waitFor(() => {
      expect(screen.getByText(/duplicate groups found/)).toBeInTheDocument()
    })

    // Click the close button (aria-label="Close")
    const closeBtn = screen.getByLabelText('Close')
    fireEvent.click(closeBtn)

    await waitFor(() => {
      expect(screen.queryByText(/duplicate groups found/)).not.toBeInTheDocument()
    })
  })

  it('navigates to edit page when clicking a duplicate entry', async () => {
    const { findDuplicateMessages } = await import('@/api/translations.api')
    ;(findDuplicateMessages as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        message: 'Saqlash',
        entries: [
          {
            id: 'tr-002',
            category: 'button',
            messageKey: 'Save',
            message: 'Saqlash',
            isActive: true,
          },
          {
            id: 'tr-003',
            category: 'action',
            messageKey: 'SaveRecord',
            message: 'Saqlash',
            isActive: true,
          },
        ],
      },
    ])

    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Find duplicates')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Find duplicates'))
    })

    await waitFor(() => {
      expect(screen.getByText('SaveRecord')).toBeInTheDocument()
    })

    // Click the duplicate entry button
    fireEvent.click(screen.getByText('SaveRecord'))

    expect(mockNavigate).toHaveBeenCalledWith('/system/translation/tr-003/edit')
  })

  // ====== NEW TESTS: Toggle active mutation error ======

  it('shows error toast when toggle active fails', async () => {
    const { toggleTranslationActive } = await import('@/api/translations.api')
    ;(toggleTranslationActive as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Toggle error'),
    )

    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    const toggleButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.textContent === '\u2713' || btn.textContent === '\u25CB')

    await act(async () => {
      fireEvent.click(toggleButtons[0])
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to toggle active status')
    })
  })

  // ====== NEW TESTS: Handles non-array content safely ======

  it('handles response with undefined content gracefully', async () => {
    const { getTranslations } = await import('@/api/translations.api')
    ;(getTranslations as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      content: undefined,
      currentPage: 0,
      totalItems: 0,
      totalPages: 0,
      pageSize: 20,
    })

    render(<TranslationsPage />)

    await waitFor(() => {
      expect(screen.getByText('No translations found')).toBeInTheDocument()
    })
  })
})
