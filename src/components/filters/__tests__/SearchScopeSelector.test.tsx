/**
 * SearchScopeSelector Component Tests
 *
 * Tests rendering, scope selection, search input, and callbacks.
 */

import { render, screen, fireEvent } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params) {
        let result = key
        Object.entries(params).forEach(([k, v]) => {
          result = result.replace(`{{${k}}}`, String(v))
        })
        return result
      }
      return key
    },
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

import { SearchScopeSelector } from '../SearchScopeSelector'

// ---------------------------------------------------------------------------
// Test Data
// ---------------------------------------------------------------------------

const mockScopes = [
  { value: 'all', label: 'Hamma' },
  { value: 'name', label: 'Nomi' },
  { value: 'code', label: 'Kodi' },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SearchScopeSelector', () => {
  const defaultProps = {
    value: 'all',
    onChange: vi.fn(),
    scopes: mockScopes,
    searchValue: '',
    onSearchChange: vi.fn(),
    onSearch: vi.fn(),
    onClear: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the search input', () => {
    render(<SearchScopeSelector {...defaultProps} />)
    const input = screen.getByPlaceholderText('Search by Hamma...')
    expect(input).toBeInTheDocument()
  })

  it('renders scope selector trigger', () => {
    render(<SearchScopeSelector {...defaultProps} />)
    // The select trigger shows the scope label
    expect(screen.getByText('Search:')).toBeInTheDocument()
  })

  it('calls onSearchChange when typing in the search input', async () => {
    const user = userEvent.setup()
    render(<SearchScopeSelector {...defaultProps} />)

    const input = screen.getByPlaceholderText('Search by Hamma...')
    await user.type(input, 'test')

    expect(defaultProps.onSearchChange).toHaveBeenCalled()
  })

  it('calls onSearch when Enter is pressed', () => {
    render(<SearchScopeSelector {...defaultProps} />)

    const input = screen.getByPlaceholderText('Search by Hamma...')
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(defaultProps.onSearch).toHaveBeenCalled()
  })

  it('shows clear button when searchValue is not empty', () => {
    render(<SearchScopeSelector {...defaultProps} searchValue="test" />)

    // There should be a clear button (the X button)
    const clearButton = screen.getByRole('button')
    expect(clearButton).toBeInTheDocument()
  })

  it('calls onClear when clear button is clicked', async () => {
    const user = userEvent.setup()
    render(<SearchScopeSelector {...defaultProps} searchValue="test" />)

    // Click the clear (X) button
    const clearButton = screen.getByRole('button')
    await user.click(clearButton)

    expect(defaultProps.onClear).toHaveBeenCalled()
  })

  it('does not show clear button when searchValue is empty', () => {
    render(<SearchScopeSelector {...defaultProps} searchValue="" />)

    // The only buttons should be from the Select component
    const buttons = screen.queryAllByRole('button')
    // Check if any button specifically is for clearing - there should be none for clearing
    // The select trigger is a button-like element
    expect(buttons.length).toBeLessThanOrEqual(1)
  })

  it('updates placeholder based on selected scope', () => {
    render(<SearchScopeSelector {...defaultProps} value="name" />)
    expect(screen.getByPlaceholderText('Search by Nomi...')).toBeInTheDocument()
  })
})
