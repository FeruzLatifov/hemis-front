/**
 * ColumnSettingsPopover Component Tests
 *
 * Tests rendering, popover opening, column toggles, and "show all" button.
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

import { ColumnSettingsPopover } from '../ColumnSettingsPopover'

// ---------------------------------------------------------------------------
// Test Data
// ---------------------------------------------------------------------------

const mockColumns = [
  { id: 'name', label: 'Name', visible: true, canHide: false },
  { id: 'email', label: 'Email', visible: true, canHide: true },
  { id: 'phone', label: 'Phone', visible: false, canHide: true },
  { id: 'address', label: 'Address', visible: false, canHide: true },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ColumnSettingsPopover', () => {
  const defaultProps = {
    columns: mockColumns,
    onToggle: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the settings button', () => {
    render(<ColumnSettingsPopover {...defaultProps} />)
    const button = screen.getByTitle('Column settings')
    expect(button).toBeInTheDocument()
  })

  it('opens popover on click', async () => {
    const user = userEvent.setup()
    render(<ColumnSettingsPopover {...defaultProps} />)

    const button = screen.getByTitle('Column settings')
    await user.click(button)

    // Popover content should be visible
    expect(screen.getByText('Column settings')).toBeInTheDocument()
  })

  it('shows column count info', async () => {
    const user = userEvent.setup()
    render(<ColumnSettingsPopover {...defaultProps} />)

    await user.click(screen.getByTitle('Column settings'))

    // Shows "Shown: 2 / 4" - text is split, use regex on partial match
    expect(screen.getByText(/Shown/)).toBeInTheDocument()
  })

  it('shows all column labels', async () => {
    const user = userEvent.setup()
    render(<ColumnSettingsPopover {...defaultProps} />)

    await user.click(screen.getByTitle('Column settings'))

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Phone')).toBeInTheDocument()
    expect(screen.getByText('Address')).toBeInTheDocument()
  })

  it('shows "Required" badge for columns that cannot be hidden', async () => {
    const user = userEvent.setup()
    render(<ColumnSettingsPopover {...defaultProps} />)

    await user.click(screen.getByTitle('Column settings'))

    expect(screen.getByText('Required')).toBeInTheDocument()
  })

  it('calls onToggle when a hideable column checkbox is clicked', async () => {
    const user = userEvent.setup()
    render(<ColumnSettingsPopover {...defaultProps} />)

    await user.click(screen.getByTitle('Column settings'))

    // Click the Email column label (which triggers the checkbox)
    const emailLabel = screen.getByText('Email').closest('label')!
    await user.click(emailLabel)

    expect(defaultProps.onToggle).toHaveBeenCalledWith('email')
  })

  it('shows "Show all" button', async () => {
    const user = userEvent.setup()
    render(<ColumnSettingsPopover {...defaultProps} />)

    await user.click(screen.getByTitle('Column settings'))

    expect(screen.getByText('Show all')).toBeInTheDocument()
  })

  it('calls onToggle for all hidden hideable columns when "Show all" is clicked', async () => {
    const user = userEvent.setup()
    render(<ColumnSettingsPopover {...defaultProps} />)

    await user.click(screen.getByTitle('Column settings'))
    await user.click(screen.getByText('Show all'))

    // Phone and Address are hidden and canHide, so onToggle should be called for both
    expect(defaultProps.onToggle).toHaveBeenCalledWith('phone')
    expect(defaultProps.onToggle).toHaveBeenCalledWith('address')
    // But not for Email (already visible) or Name (canHide=false)
    expect(defaultProps.onToggle).not.toHaveBeenCalledWith('email')
    expect(defaultProps.onToggle).not.toHaveBeenCalledWith('name')
  })
})
