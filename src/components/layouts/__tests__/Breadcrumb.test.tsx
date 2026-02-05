/**
 * Breadcrumb Component Tests
 *
 * Tests breadcrumb rendering, home link, active page display,
 * and integration with menu store for labels.
 */

import { render, screen } from '@/test/test-utils'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'uz',
      changeLanguage: vi.fn(),
      t: (key: string) => key,
      on: vi.fn(),
      off: vi.fn(),
    },
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

let mockPathname = '/students'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
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
    labelUz: 'Tizim',
    labelOz: 'Tizim',
    labelRu: 'Tizim',
    labelEn: 'System',
    label: 'Tizim',
    url: undefined,
    icon: 'settings',
    visible: true,
    orderNum: 3,
    items: [
      {
        id: 'menu-3-1',
        labelUz: 'Tarjimalar',
        labelOz: 'Tarjimalar',
        labelRu: 'Tarjimalar',
        labelEn: 'Translations',
        label: 'Tarjimalar',
        url: '/system/translations',
        icon: 'languages',
        visible: true,
        orderNum: 1,
        items: [],
      },
    ],
  },
]

vi.mock('@/stores/menuStore', () => ({
  useRootMenuItems: vi.fn(() => mockMenuItems),
}))

vi.mock('@/utils/menu.util', () => ({
  getMenuLabel: (item: { labelUz: string }) => item.labelUz,
}))

import Breadcrumb from '../Breadcrumb'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Breadcrumb', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPathname = '/students'
  })

  it('renders breadcrumb navigation', () => {
    render(<Breadcrumb />)
    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument()
  })

  it('shows home link', () => {
    render(<Breadcrumb />)
    const homeLink = screen.getByTitle('Dashboard')
    expect(homeLink).toBeInTheDocument()
    expect(homeLink).toHaveAttribute('href', '/dashboard')
  })

  it('shows current page from menu tree', () => {
    render(<Breadcrumb />)
    expect(screen.getByText('Talabalar')).toBeInTheDocument()
  })

  it('active page is not a link', () => {
    render(<Breadcrumb />)
    const activePage = screen.getByText('Talabalar')
    expect(activePage.getAttribute('aria-current')).toBe('page')
    expect(activePage.tagName.toLowerCase()).toBe('span')
  })

  it('does not render breadcrumb on dashboard', () => {
    mockPathname = '/dashboard'
    const { container } = render(<Breadcrumb />)
    // Should return null
    expect(container.innerHTML).toBe('')
  })

  it('does not render breadcrumb on root path', () => {
    mockPathname = '/'
    const { container } = render(<Breadcrumb />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nested breadcrumb path for child menu items', () => {
    mockPathname = '/system/translations'
    render(<Breadcrumb />)

    // Should show parent and child
    expect(screen.getByText('Tizim')).toBeInTheDocument()
    expect(screen.getByText('Tarjimalar')).toBeInTheDocument()
  })

  it('uses fallback labels for routes not in menu tree', () => {
    mockPathname = '/reports'
    render(<Breadcrumb />)
    expect(screen.getByText('Reports')).toBeInTheDocument()
  })

  it('renders chevron separator between items', () => {
    const { container } = render(<Breadcrumb />)
    // Chevrons have aria-hidden="true" and the class 'lucide-chevron-right'
    const chevrons = container.querySelectorAll('[aria-hidden="true"]')
    expect(chevrons.length).toBeGreaterThanOrEqual(1)
  })
})
