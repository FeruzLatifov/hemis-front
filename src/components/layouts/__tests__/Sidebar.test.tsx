/**
 * Sidebar Component Tests
 *
 * Tests sidebar rendering, menu items, active state,
 * sub-menu collapse/expand, favorites, and responsive behavior.
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
    url: undefined,
    icon: 'users',
    visible: true,
    orderNum: 2,
    items: [
      {
        id: 'menu-2-1',
        labelUz: "Talabalar ro'yxati",
        labelOz: "Talabalar ro'yxati",
        labelRu: "Talabalar ro'yxati",
        labelEn: 'Students List',
        label: "Talabalar ro'yxati",
        url: '/students',
        icon: 'users',
        visible: true,
        orderNum: 1,
        items: [],
      },
    ],
  },
]

vi.mock('@/stores/menuStore', () => ({
  useMenuStore: vi.fn(
    (selector: (state: { menuItems: typeof mockMenuItems; isLoading: boolean }) => unknown) =>
      selector({
        menuItems: mockMenuItems,
        isLoading: false,
      }),
  ),
  useRootMenuItems: vi.fn(() => mockMenuItems),
  useMenuLoading: vi.fn(() => false),
}))

vi.mock('@/stores/favoritesStore', () => ({
  useFavoritesStore: vi.fn((selector?: (state: Record<string, unknown>) => unknown) => {
    const state = {
      favorites: [],
      isFavorite: () => false,
      clearFavorites: vi.fn(),
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
  useFavoritesList: vi.fn(() => []),
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector?: (state: Record<string, unknown>) => unknown) => {
    const state = {
      isAuthenticated: true,
      user: { username: 'Test', locale: 'uz' },
      permissions: [],
      logout: vi.fn(),
    }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

const mockNavigate = vi.fn()
let mockPathname = '/dashboard'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      pathname: mockPathname,
      search: '',
      hash: '',
      state: null,
      key: 'default',
    }),
    Link: ({
      children,
      to,
      ...rest
    }: {
      children: React.ReactNode
      to: string
    } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a href={to} {...rest}>
        {children}
      </a>
    ),
  }
})

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

vi.mock('@/hooks/useFavorites', () => ({
  useAddFavorite: () => ({ mutate: vi.fn() }),
  useRemoveFavorite: () => ({ mutate: vi.fn() }),
}))

interface MenuItem {
  id: string
  labelUz: string
  url?: string
  items?: MenuItem[]
}

vi.mock('@/api/menu.api', async () => {
  const actual = await vi.importActual<{ flattenMenuTree: (items: MenuItem[]) => MenuItem[] }>(
    '@/api/menu.api',
  )
  return {
    ...actual,
    flattenMenuTree: (items: MenuItem[]) => {
      const result: MenuItem[] = []
      for (const item of items) {
        result.push(item)
        if (item.items && item.items.length > 0) {
          result.push(...actual.flattenMenuTree(item.items))
        }
      }
      return result
    },
  }
})

vi.mock('@/assets/images/hemis-logo-new.png', () => ({
  default: 'hemis-logo.png',
}))

import Sidebar from '../Sidebar'
import { useRootMenuItems, useMenuLoading } from '@/stores/menuStore'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Sidebar', () => {
  const defaultProps = {
    open: true,
    setOpen: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockPathname = '/dashboard'
  })

  it('renders the sidebar when open=true', () => {
    render(<Sidebar {...defaultProps} />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('shows HEMIS branding when open', () => {
    render(<Sidebar {...defaultProps} />)
    expect(screen.getByText('HEMIS')).toBeInTheDocument()
    expect(screen.getByText('Ministry Portal')).toBeInTheDocument()
  })

  it('shows menu items from menuStore', () => {
    render(<Sidebar {...defaultProps} />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Talabalar')).toBeInTheDocument()
  })

  it('renders menu items as links for leaf items', () => {
    render(<Sidebar {...defaultProps} />)
    // Dashboard is a leaf item with a URL
    const dashboardLink = screen.getByText('Dashboard').closest('a')
    expect(dashboardLink).toHaveAttribute('href', '/dashboard')
  })

  it('renders expand/collapse button for items with children', () => {
    render(<Sidebar {...defaultProps} />)
    // "Talabalar" has children so it should be a button
    const submenuButton = screen.getByText('Talabalar').closest('button')
    expect(submenuButton).toBeInTheDocument()
  })

  it('expands sub-menu when parent is clicked', async () => {
    const user = userEvent.setup()
    render(<Sidebar {...defaultProps} />)

    // Child should not be visible initially
    expect(screen.queryByText("Talabalar ro'yxati")).not.toBeInTheDocument()

    // Click the parent to expand
    const submenuButton = screen.getByText('Talabalar').closest('button')!
    await user.click(submenuButton)

    // Now child should be visible
    expect(screen.getByText("Talabalar ro'yxati")).toBeInTheDocument()
  })

  it('collapses sub-menu when parent is clicked again', async () => {
    const user = userEvent.setup()
    render(<Sidebar {...defaultProps} />)

    const submenuButton = screen.getByText('Talabalar').closest('button')!

    // Expand
    await user.click(submenuButton)
    expect(screen.getByText("Talabalar ro'yxati")).toBeInTheDocument()

    // Collapse
    await user.click(submenuButton)
    expect(screen.queryByText("Talabalar ro'yxati")).not.toBeInTheDocument()
  })

  it('renders the toggle button to open/close sidebar', () => {
    render(<Sidebar {...defaultProps} />)
    const toggleButton = screen.getByLabelText('Close menu')
    expect(toggleButton).toBeInTheDocument()
  })

  it('calls setOpen when toggle button is clicked', async () => {
    const user = userEvent.setup()
    const setOpen = vi.fn()
    render(<Sidebar open={true} setOpen={setOpen} />)

    const toggleButton = screen.getByLabelText('Close menu')
    await user.click(toggleButton)

    expect(setOpen).toHaveBeenCalledWith(false)
  })

  it('shows loading state when menu is loading', () => {
    vi.mocked(useMenuLoading).mockReturnValue(true)

    render(<Sidebar {...defaultProps} />)
    expect(screen.getByText('Menyu yuklanmoqda...')).toBeInTheDocument()

    vi.mocked(useMenuLoading).mockReturnValue(false)
  })

  it('shows empty state when no menu items', () => {
    vi.mocked(useRootMenuItems).mockReturnValue([])

    render(<Sidebar {...defaultProps} />)
    expect(screen.getByText('Menyu elementlari mavjud emas')).toBeInTheDocument()

    vi.mocked(useRootMenuItems).mockReturnValue(
      mockMenuItems as ReturnType<typeof useRootMenuItems>,
    )
  })

  it('shows footer with version info when open', () => {
    render(<Sidebar {...defaultProps} />)
    expect(screen.getByText('HEMIS Ministry')).toBeInTheDocument()
    expect(screen.getByText('v2.0.0')).toBeInTheDocument()
  })

  it('renders mobile overlay when open', () => {
    const { container } = render(<Sidebar {...defaultProps} />)
    const overlay = container.querySelector('[role="presentation"]')
    expect(overlay).toBeInTheDocument()
  })

  it('closes sidebar when overlay is clicked', async () => {
    const user = userEvent.setup()
    const setOpen = vi.fn()
    const { container } = render(<Sidebar open={true} setOpen={setOpen} />)

    const overlay = container.querySelector('[role="presentation"]')!
    await user.click(overlay)

    expect(setOpen).toHaveBeenCalledWith(false)
  })
})
