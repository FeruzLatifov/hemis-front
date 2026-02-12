/**
 * CustomTagFilter Component Tests
 *
 * Tests rendering, clear/remove buttons, popover with search and button items.
 */

import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'uz', changeLanguage: vi.fn(), on: vi.fn(), off: vi.fn() },
  }),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

vi.mock('@/i18n/config', () => ({
  default: {
    t: (key: string) => key,
    language: 'uz',
    changeLanguage: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
  shortToBcp47: { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US', oz: 'oz-UZ' },
}))

import { CustomTagFilter } from '../CustomTagFilter'

// ---------------------------------------------------------------------------
// Test Data
// ---------------------------------------------------------------------------

const mockData = [
  { code: 'active', name: 'Faol' },
  { code: 'inactive', name: 'Nofaol' },
  { code: 'graduated', name: 'Bitirgan' },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CustomTagFilter', () => {
  const defaultProps = {
    label: 'Holat',
    data: mockData,
    value: ['active'],
    onChange: vi.fn(),
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the filter label with colon', () => {
    render(<CustomTagFilter {...defaultProps} />)
    expect(screen.getByText('Holat:')).toBeInTheDocument()
  })

  it('renders selected item name', () => {
    render(<CustomTagFilter {...defaultProps} />)
    expect(screen.getByText('Faol')).toBeInTheDocument()
  })

  it('shows "All" text when value is empty', () => {
    render(<CustomTagFilter {...defaultProps} value={[]} />)
    expect(screen.getByText('All')).toBeInTheDocument()
  })

  it('shows "+N" badge when multiple items selected', () => {
    render(<CustomTagFilter {...defaultProps} value={['active', 'inactive']} />)
    expect(screen.getByText('+1')).toBeInTheDocument()
  })

  it('renders clear button when items are selected', () => {
    render(<CustomTagFilter {...defaultProps} />)
    const clearBtn = screen.getByTitle('Clear')
    expect(clearBtn).toBeInTheDocument()
  })

  it('renders remove filter button when no items selected and onClose provided', () => {
    render(<CustomTagFilter {...defaultProps} value={[]} />)
    const removeBtn = screen.getByTitle('Remove filter')
    expect(removeBtn).toBeInTheDocument()
  })

  it('calls onChange with empty array when clear button is clicked', async () => {
    const user = userEvent.setup()
    render(<CustomTagFilter {...defaultProps} />)

    await user.click(screen.getByTitle('Clear'))
    expect(defaultProps.onChange).toHaveBeenCalledWith([])
  })

  it('opens popover on trigger click and shows items', async () => {
    const user = userEvent.setup()
    render(<CustomTagFilter {...defaultProps} />)

    await user.click(screen.getByText('Holat:'))

    // Should show all items in the popover
    // "Faol" already exists in the trigger, but it should also appear in the popover list
    const faolElements = screen.getAllByText('Faol')
    expect(faolElements.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Nofaol')).toBeInTheDocument()
    expect(screen.getByText('Bitirgan')).toBeInTheDocument()
  })

  it('shows "All" option in popover', async () => {
    const user = userEvent.setup()
    render(<CustomTagFilter {...defaultProps} />)

    await user.click(screen.getByText('Holat:'))

    // The "All" button should be present in the popover
    const allElements = screen.getAllByText('All')
    expect(allElements.length).toBeGreaterThanOrEqual(1)
  })

  it('shows search input in popover', async () => {
    const user = userEvent.setup()
    render(<CustomTagFilter {...defaultProps} />)

    await user.click(screen.getByText('Holat:'))

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('filters items based on search query', async () => {
    const user = userEvent.setup()
    render(<CustomTagFilter {...defaultProps} />)

    await user.click(screen.getByText('Holat:'))

    const searchInput = screen.getByPlaceholderText('Search...')
    await user.type(searchInput, 'Faol')

    // "Faol" and "Nofaol" (contains "Faol") should be visible
    const faolElements = screen.getAllByText(/Faol/)
    expect(faolElements.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Nofaol')).toBeInTheDocument()
    expect(screen.queryByText('Bitirgan')).not.toBeInTheDocument()
  })

  it('shows empty state when search has no results', async () => {
    const user = userEvent.setup()
    render(<CustomTagFilter {...defaultProps} />)

    await user.click(screen.getByText('Holat:'))

    const searchInput = screen.getByPlaceholderText('Search...')
    await user.type(searchInput, 'xxxxxxxxxxx')

    expect(screen.getByText('No results found')).toBeInTheDocument()
  })

  it('calls onChange when item button is clicked (add)', async () => {
    const user = userEvent.setup()
    render(<CustomTagFilter {...defaultProps} />)

    await user.click(screen.getByText('Holat:'))

    // Click on "Nofaol" button to toggle it
    await user.click(screen.getByText('Nofaol'))

    expect(defaultProps.onChange).toHaveBeenCalledWith(['active', 'inactive'])
  })

  it('calls onChange when item button is clicked (remove)', async () => {
    const user = userEvent.setup()
    render(<CustomTagFilter {...defaultProps} />)

    await user.click(screen.getByText('Holat:'))

    // Click on "Faol" in the popover list to toggle it off
    // "Faol" appears in both trigger and popover, get the one in the popover list
    const faolElements = screen.getAllByText('Faol')
    // The last one should be in the popover items list
    await user.click(faolElements[faolElements.length - 1])

    expect(defaultProps.onChange).toHaveBeenCalledWith([])
  })

  it('calls onChange with empty array when "All" is clicked (clears selection)', async () => {
    const user = userEvent.setup()
    render(<CustomTagFilter {...defaultProps} />)

    await user.click(screen.getByText('Holat:'))

    // Click the "All" button in the popover — clears selection
    const allElements = screen.getAllByText('All')
    // The "All" button inside the popover
    await user.click(allElements[allElements.length - 1])

    expect(defaultProps.onChange).toHaveBeenCalledWith([])
  })
})
