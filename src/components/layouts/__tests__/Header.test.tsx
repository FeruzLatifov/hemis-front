/**
 * Header Component Tests
 *
 * Tests menu toggle, user info, language switcher, theme toggle,
 * user dropdown, and logout behavior.
 */

import { render, screen, fireEvent } from '@/test/test-utils'
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

const mockLogout = vi.fn()
const mockNavigate = vi.fn()

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { username: 'TestAdmin', email: 'admin@hemis.uz' },
    logout: mockLogout,
  })),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/hooks/useClearCache', () => ({
  useClearCache: () => ({
    isClearingCache: false,
    clearCache: vi.fn(),
  }),
}))

vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light' as const, setTheme: vi.fn() }),
}))

import Header from '../Header'
import { useAuthStore } from '@/stores/authStore'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Header', () => {
  const mockSetSidebarOpen = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the header element', () => {
    render(<Header setSidebarOpen={mockSetSidebarOpen} />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('renders the mobile menu toggle button', () => {
    render(<Header setSidebarOpen={mockSetSidebarOpen} />)
    const menuButton = screen.getByLabelText('Open menu')
    expect(menuButton).toBeInTheDocument()
  })

  it('calls setSidebarOpen(true) when mobile menu button is clicked', async () => {
    const user = userEvent.setup()
    render(<Header setSidebarOpen={mockSetSidebarOpen} />)

    const menuButton = screen.getByLabelText('Open menu')
    await user.click(menuButton)

    expect(mockSetSidebarOpen).toHaveBeenCalledWith(true)
  })

  it('renders user name from auth store', () => {
    render(<Header setSidebarOpen={mockSetSidebarOpen} />)
    expect(screen.getByText('TestAdmin')).toBeInTheDocument()
  })

  it('renders the notifications button', () => {
    render(<Header setSidebarOpen={mockSetSidebarOpen} />)
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument()
  })

  it('renders the search button with Ctrl+K hint', () => {
    render(<Header setSidebarOpen={mockSetSidebarOpen} />)
    expect(screen.getByLabelText('Search pages (Ctrl+K)')).toBeInTheDocument()
  })

  it('does not show language/theme/cache as top-level toolbar buttons', () => {
    // Senior-design pass: these are settings, not toolbar actions. They
    // belong inside the user dropdown so the toolbar stays at three items
    // and a destructive "clear cache" can't be hit by accident.
    render(<Header setSidebarOpen={mockSetSidebarOpen} />)
    // Cache live label is "Clear cache" — must NOT exist outside the closed dropdown.
    expect(screen.queryByLabelText('Clear cache')).not.toBeInTheDocument()
    // Theme live label is "Toggle theme" — must NOT exist outside the closed dropdown.
    expect(screen.queryByLabelText('Toggle theme')).not.toBeInTheDocument()
  })

  it('opens user dropdown on click and exposes preferences', async () => {
    const user = userEvent.setup()
    render(<Header setSidebarOpen={mockSetSidebarOpen} />)

    const userMenuButton = screen.getByLabelText('User menu')
    await user.click(userMenuButton)

    // Account section
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    // Preferences section — moved here from toolbar
    expect(screen.getByText('Language')).toBeInTheDocument()
    expect(screen.getByText('Clear cache')).toBeInTheDocument()
    // Logout
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('opens language sub-menu and shows the four supported languages', async () => {
    const user = userEvent.setup()
    render(<Header setSidebarOpen={mockSetSidebarOpen} />)

    await user.click(screen.getByLabelText('User menu'))
    await user.click(screen.getByText('Language'))

    // Sub-menu uses role=menuitemradio for each locale option.
    // Querying by role keeps us robust to the language label appearing
    // twice (once as the current-selection summary on the parent row).
    const radios = screen.getAllByRole('menuitemradio')
    expect(radios).toHaveLength(4)
    expect(radios.some((r) => r.textContent?.includes('Ўзбек'))).toBe(true)
    expect(radios.some((r) => r.textContent?.includes('Русский'))).toBe(true)
    expect(radios.some((r) => r.textContent?.includes('English'))).toBe(true)
  })

  it('shows user info in dropdown header', async () => {
    const user = userEvent.setup()
    render(<Header setSidebarOpen={mockSetSidebarOpen} />)

    const userMenuButton = screen.getByLabelText('User menu')
    await user.click(userMenuButton)

    // The dropdown also shows username and email
    const usernames = screen.getAllByText('TestAdmin')
    expect(usernames.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('admin@hemis.uz')).toBeInTheDocument()
  })

  it('calls logout and navigates to /login when logout is clicked', async () => {
    const user = userEvent.setup()
    render(<Header setSidebarOpen={mockSetSidebarOpen} />)

    // Open dropdown
    const userMenuButton = screen.getByLabelText('User menu')
    await user.click(userMenuButton)

    // Click logout
    const logoutButton = screen.getByText('Logout')
    await user.click(logoutButton)

    expect(mockLogout).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
  })

  it('closes dropdown on Escape key', async () => {
    const user = userEvent.setup()
    render(<Header setSidebarOpen={mockSetSidebarOpen} />)

    // Open dropdown
    const userMenuButton = screen.getByLabelText('User menu')
    await user.click(userMenuButton)
    expect(screen.getByRole('menu')).toBeInTheDocument()

    // Press Escape on the dropdown
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('shows default username when user is null', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      logout: mockLogout,
    } as ReturnType<typeof useAuthStore>)

    render(<Header setSidebarOpen={mockSetSidebarOpen} />)
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })
})
