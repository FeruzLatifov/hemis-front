/**
 * LanguageSwitcher Component Tests
 *
 * Tests rendering, dropdown opening/closing, language selection,
 * keyboard navigation, and outside-click behavior.
 */

import { render, screen, fireEvent } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockChangeLanguage = vi.fn()

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'uz', changeLanguage: mockChangeLanguage, on: vi.fn(), off: vi.fn() },
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

import LanguageSwitcher from '../LanguageSwitcher'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the language button', () => {
    render(<LanguageSwitcher />)
    const button = screen.getByRole('button', { expanded: false })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-haspopup', 'listbox')
  })

  it('dropdown is closed by default', () => {
    render(<LanguageSwitcher />)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('opens dropdown on click', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    const button = screen.getByRole('button', { expanded: false })
    await user.click(button)

    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('shows all 4 languages when dropdown is open', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    await user.click(screen.getByRole('button', { expanded: false }))

    // O'zbek appears twice (option + footer), so use getAllByText
    expect(screen.getAllByText("O'zbek").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Uzbek Latin')).toBeInTheDocument()
    expect(screen.getByText('Uzbek Cyrillic')).toBeInTheDocument()
    expect(screen.getByText('Russian')).toBeInTheDocument()
  })

  it('shows 4 language options', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    await user.click(screen.getByRole('button', { expanded: false }))

    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(4)
  })

  it('current language has aria-selected=true', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    await user.click(screen.getByRole('button', { expanded: false }))

    const options = screen.getAllByRole('option')
    // First option (uz) should be selected since i18n.language is 'uz'
    const uzOption = options[0]
    expect(uzOption).toHaveAttribute('aria-selected', 'true')

    // Others should not be selected
    const enOption = options[3]
    expect(enOption).toHaveAttribute('aria-selected', 'false')
  })

  it('calls i18n.changeLanguage when a language is clicked', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    await user.click(screen.getByRole('button', { expanded: false }))

    // Click on "English"
    const options = screen.getAllByRole('option')
    await user.click(options[3])

    expect(mockChangeLanguage).toHaveBeenCalledWith('en')
  })

  it('closes dropdown after language selection', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    await user.click(screen.getByRole('button', { expanded: false }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    const options = screen.getAllByRole('option')
    await user.click(options[2]) // Russian

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('closes on Escape key', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    // Open dropdown
    await user.click(screen.getByRole('button', { expanded: false }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    // Press Escape inside the listbox
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' })

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('supports keyboard navigation with ArrowDown', async () => {
    render(<LanguageSwitcher />)

    const button = screen.getByRole('button', { expanded: false })

    // Focus the button and press ArrowDown to open
    button.focus()
    fireEvent.keyDown(button, { key: 'ArrowDown' })

    // Dropdown should be open
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('supports Enter key to select focused language', async () => {
    render(<LanguageSwitcher />)

    const button = screen.getByRole('button', { expanded: false })

    // Open with ArrowDown
    button.focus()
    fireEvent.keyDown(button, { key: 'ArrowDown' })

    // Navigate down
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'ArrowDown' })

    // Select with Enter
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Enter' })

    expect(mockChangeLanguage).toHaveBeenCalled()
  })

  it('supports ArrowUp navigation', async () => {
    render(<LanguageSwitcher />)

    const button = screen.getByRole('button', { expanded: false })
    button.focus()
    fireEvent.keyDown(button, { key: 'ArrowDown' })

    // Navigate up (wraps around)
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'ArrowUp' })

    // Should still have open dropdown
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('closes when clicking outside', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <LanguageSwitcher />
      </div>,
    )

    // Open dropdown
    await user.click(screen.getByRole('button', { expanded: false }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside'))

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('shows current language info in footer', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    await user.click(screen.getByRole('button', { expanded: false }))

    // Text is split: "Current: " + <span>O'zbek</span>, use a matcher function
    expect(screen.getByText(/Current/)).toBeInTheDocument()
  })

  it('shows Select language header', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)

    await user.click(screen.getByRole('button', { expanded: false }))

    expect(screen.getByText('Select language')).toBeInTheDocument()
  })
})
