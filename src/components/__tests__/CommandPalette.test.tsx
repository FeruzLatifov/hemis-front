/**
 * CommandPalette Component Tests
 *
 * Tests visibility, Ctrl+K shortcut, Escape close, search input,
 * item filtering, navigation, and keyboard handling.
 */

import { render, screen, fireEvent, act } from '@/test/test-utils'
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

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockMenuItems = [
  {
    id: 'menu-1',
    labelUz: 'Dashboard',
    labelOz: 'Dashboard',
    labelRu: 'Dashboard',
    labelEn: 'Dashboard',
    label: 'Dashboard',
    url: '/dashboard',
    icon: 'home',
    visible: true,
    orderNum: 1,
    items: [],
  },
  {
    id: 'menu-2',
    labelUz: 'Talabalar',
    labelOz: 'Talabalar',
    labelRu: 'Talabalar',
    labelEn: 'Students',
    label: 'Talabalar',
    url: '/students',
    icon: 'users',
    visible: true,
    orderNum: 2,
    items: [],
  },
  {
    id: 'menu-3',
    labelUz: 'Hisobotlar',
    labelOz: 'Hisobotlar',
    labelRu: 'Hisobotlar',
    labelEn: 'Reports',
    label: 'Hisobotlar',
    url: '/reports',
    icon: 'bar-chart',
    visible: true,
    orderNum: 3,
    items: [],
  },
]

vi.mock('@/stores/menuStore', () => ({
  useMenuStore: vi.fn((selector: (state: { menuItems: typeof mockMenuItems }) => unknown) =>
    selector({ menuItems: mockMenuItems }),
  ),
}))

vi.mock('@/api/menu.api', () => ({
  flattenMenuTree: <T extends { items?: T[] }>(items: T[]) => {
    const result: T[] = []
    for (const item of items) {
      result.push(item)
      if (item.items && item.items.length > 0) {
        result.push(...items)
      }
    }
    return result
  },
}))

vi.mock('@/utils/iconMapper', () => ({
  getIcon: () => {
    const MockIcon = (props: React.HTMLAttributes<HTMLSpanElement>) => (
      <span data-testid="mock-icon" {...props} />
    )
    return MockIcon
  },
}))

vi.mock('@/utils/menu.util', () => ({
  getMenuLabel: (item: { labelUz: string }) => item.labelUz,
}))

import CommandPalette from '../CommandPalette'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function openPalette() {
  act(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // jsdom does not implement scrollIntoView
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('is not visible by default', () => {
    render(<CommandPalette />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens on Ctrl+K keyboard shortcut', () => {
    render(<CommandPalette />)
    openPalette()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes on Escape key', async () => {
    render(<CommandPalette />)
    openPalette()
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // Press Escape in the search input
    const input = screen.getByPlaceholderText('Sahifalarni qidirish...')
    fireEvent.keyDown(input, { key: 'Escape' })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows search input when open', () => {
    render(<CommandPalette />)
    openPalette()
    expect(screen.getByPlaceholderText('Sahifalarni qidirish...')).toBeInTheDocument()
  })

  it('shows all menu items when no search query', () => {
    render(<CommandPalette />)
    openPalette()

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Talabalar')).toBeInTheDocument()
    expect(screen.getByText('Hisobotlar')).toBeInTheDocument()
  })

  it('shows "all pages" label when no query', () => {
    render(<CommandPalette />)
    openPalette()

    expect(screen.getByText('Barcha sahifalar')).toBeInTheDocument()
  })

  it('filters menu items based on search query', async () => {
    const user = userEvent.setup()
    render(<CommandPalette />)
    openPalette()

    const input = screen.getByPlaceholderText('Sahifalarni qidirish...')
    await user.type(input, 'Dashboard')

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    // Other items should be filtered out
    expect(screen.queryByText('Hisobotlar')).not.toBeInTheDocument()
  })

  it('shows results label when searching', async () => {
    const user = userEvent.setup()
    render(<CommandPalette />)
    openPalette()

    const input = screen.getByPlaceholderText('Sahifalarni qidirish...')
    await user.type(input, 'Dash')

    expect(screen.getByText('Natijalar')).toBeInTheDocument()
  })

  it('shows empty state when no results found', async () => {
    const user = userEvent.setup()
    render(<CommandPalette />)
    openPalette()

    const input = screen.getByPlaceholderText('Sahifalarni qidirish...')
    await user.type(input, 'xxxxxxxxxxx')

    expect(screen.getByText('Natija topilmadi')).toBeInTheDocument()
  })

  it('navigates on item selection via click', async () => {
    const user = userEvent.setup()
    render(<CommandPalette />)
    openPalette()

    const dashboardItem = screen.getByText('Dashboard').closest('button')!
    await user.click(dashboardItem)

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })

  it('navigates on Enter key press', () => {
    render(<CommandPalette />)
    openPalette()

    const input = screen.getByPlaceholderText('Sahifalarni qidirish...')
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockNavigate).toHaveBeenCalled()
  })

  it('closes palette after item selection', async () => {
    const user = userEvent.setup()
    render(<CommandPalette />)
    openPalette()

    const dashboardItem = screen.getByText('Dashboard').closest('button')!
    await user.click(dashboardItem)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes on overlay click', async () => {
    const user = userEvent.setup()
    render(<CommandPalette />)
    openPalette()

    // Click the overlay (the outermost div)
    const dialog = screen.getByRole('dialog')
    await user.click(dialog)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('supports ArrowDown keyboard navigation', () => {
    render(<CommandPalette />)
    openPalette()

    const input = screen.getByPlaceholderText('Sahifalarni qidirish...')
    fireEvent.keyDown(input, { key: 'ArrowDown' })

    // Should move active index, just ensure no error
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('supports ArrowUp keyboard navigation', () => {
    render(<CommandPalette />)
    openPalette()

    const input = screen.getByPlaceholderText('Sahifalarni qidirish...')
    fireEvent.keyDown(input, { key: 'ArrowUp' })

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('shows keyboard hint footer', () => {
    render(<CommandPalette />)
    openPalette()

    expect(screen.getByText('navigatsiya')).toBeInTheDocument()
    expect(screen.getByText('tanlash')).toBeInTheDocument()
    expect(screen.getByText('yopish')).toBeInTheDocument()
  })

  it('toggles open/closed on repeated Ctrl+K', () => {
    render(<CommandPalette />)

    // Open
    openPalette()
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // Close
    openPalette()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows ESC keyboard hint', () => {
    render(<CommandPalette />)
    openPalette()

    expect(screen.getByText('ESC')).toBeInTheDocument()
  })
})
