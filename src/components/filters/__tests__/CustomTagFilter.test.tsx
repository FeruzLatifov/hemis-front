/**
 * CustomTagFilter Component Tests
 *
 * Tests rendering, close button, popover with search and checkbox items.
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

  it('renders the filter label', () => {
    render(<CustomTagFilter {...defaultProps} />)
    expect(screen.getByText('Holat')).toBeInTheDocument()
  })

  it('renders selected count badge', () => {
    render(<CustomTagFilter {...defaultProps} />)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('does not render badge when value is empty', () => {
    render(<CustomTagFilter {...defaultProps} value={[]} />)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('renders the close (remove) button', () => {
    render(<CustomTagFilter {...defaultProps} />)
    // The close button has an X icon
    const closeButtons = screen.getAllByRole('button')
    // Last button should be the close button
    const closeButton = closeButtons[closeButtons.length - 1]
    expect(closeButton).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<CustomTagFilter {...defaultProps} />)

    const closeButtons = screen.getAllByRole('button')
    // The close button is separate from the label button
    const closeButton = closeButtons[closeButtons.length - 1]
    await user.click(closeButton)

    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('opens popover on label click and shows items', async () => {
    const user = userEvent.setup()
    render(<CustomTagFilter {...defaultProps} />)

    // Click the label button to open popover
    await user.click(screen.getByText('Holat'))

    // Should show all items
    expect(screen.getByText('Faol')).toBeInTheDocument()
    expect(screen.getByText('Nofaol')).toBeInTheDocument()
    expect(screen.getByText('Bitirgan')).toBeInTheDocument()
  })

  it('shows "Select all" option in popover', async () => {
    const user = userEvent.setup()
    render(<CustomTagFilter {...defaultProps} />)

    await user.click(screen.getByText('Holat'))

    expect(screen.getByText('Barchasini tanlang')).toBeInTheDocument()
  })

  it('shows search input in popover', async () => {
    const user = userEvent.setup()
    render(<CustomTagFilter {...defaultProps} />)

    await user.click(screen.getByText('Holat'))

    expect(screen.getByPlaceholderText('Qidirish...')).toBeInTheDocument()
  })

  it('filters items based on search query', async () => {
    const user = userEvent.setup()
    render(<CustomTagFilter {...defaultProps} />)

    await user.click(screen.getByText('Holat'))

    const searchInput = screen.getByPlaceholderText('Qidirish...')
    await user.type(searchInput, 'Faol')

    expect(screen.getByText('Faol')).toBeInTheDocument()
    expect(screen.getByText('Nofaol')).toBeInTheDocument() // "Nofaol" contains "Faol"
    expect(screen.queryByText('Bitirgan')).not.toBeInTheDocument()
  })

  it('shows empty state when search has no results', async () => {
    const user = userEvent.setup()
    render(<CustomTagFilter {...defaultProps} />)

    await user.click(screen.getByText('Holat'))

    const searchInput = screen.getByPlaceholderText('Qidirish...')
    await user.type(searchInput, 'xxxxxxxxxxx')

    expect(screen.getByText('Hech narsa topilmadi')).toBeInTheDocument()
  })

  it('calls onChange when item checkbox is toggled (add)', async () => {
    const user = userEvent.setup()
    render(<CustomTagFilter {...defaultProps} />)

    await user.click(screen.getByText('Holat'))

    // Click on "Nofaol" label to toggle it
    const nofaolLabel = screen.getByText('Nofaol').closest('label')!
    await user.click(nofaolLabel)

    expect(defaultProps.onChange).toHaveBeenCalledWith(['active', 'inactive'])
  })

  it('calls onChange when item checkbox is toggled (remove)', async () => {
    const user = userEvent.setup()
    render(<CustomTagFilter {...defaultProps} />)

    await user.click(screen.getByText('Holat'))

    // Click on "Faol" label to toggle it off (currently selected)
    const faolLabel = screen.getByText('Faol').closest('label')!
    await user.click(faolLabel)

    expect(defaultProps.onChange).toHaveBeenCalledWith([])
  })

  it('calls onChange with all codes when select all is clicked', async () => {
    const user = userEvent.setup()
    render(<CustomTagFilter {...defaultProps} value={[]} />)

    await user.click(screen.getByText('Holat'))

    const selectAllLabel = screen.getByText('Barchasini tanlang').closest('label')!
    await user.click(selectAllLabel)

    expect(defaultProps.onChange).toHaveBeenCalledWith(['active', 'inactive', 'graduated'])
  })

  it('calls onChange with empty array when deselect all', async () => {
    const user = userEvent.setup()
    render(<CustomTagFilter {...defaultProps} value={['active', 'inactive', 'graduated']} />)

    await user.click(screen.getByText('Holat'))

    const selectAllLabel = screen.getByText('Barchasini tanlang').closest('label')!
    await user.click(selectAllLabel)

    expect(defaultProps.onChange).toHaveBeenCalledWith([])
  })
})
