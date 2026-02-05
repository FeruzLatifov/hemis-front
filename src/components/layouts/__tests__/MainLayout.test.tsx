/**
 * MainLayout Component Tests
 *
 * Tests rendering of sidebar, header, breadcrumb, command palette
 * and responsive behavior (window resize handling).
 */

import { render, screen, act } from '@/test/test-utils'

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

vi.mock('@/hooks/useMenuInit', () => ({
  useMenuInit: vi.fn(() => ({ isLoading: false, error: null, hasMenu: true })),
}))

const SidebarMock = vi.fn(({ open }: { open: boolean }) => (
  <div data-testid="sidebar" data-open={open}>
    Sidebar
  </div>
))
vi.mock('../Sidebar', () => ({
  default: (props: { open: boolean; setOpen: (v: boolean) => void }) => SidebarMock(props),
}))

const HeaderMock = vi.fn(({ setSidebarOpen }: { setSidebarOpen: (v: boolean) => void }) => (
  <div data-testid="header">
    <button data-testid="header-toggle" onClick={() => setSidebarOpen(true)}>
      Toggle
    </button>
  </div>
))
vi.mock('../Header', () => ({
  default: (props: { setSidebarOpen: (v: boolean) => void }) => HeaderMock(props),
}))

vi.mock('../Breadcrumb', () => ({
  default: () => <div data-testid="breadcrumb">Breadcrumb</div>,
}))

vi.mock('../../CommandPalette', () => ({
  default: () => <div data-testid="command-palette">CommandPalette</div>,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet">Page Content</div>,
  }
})

import MainLayout from '../MainLayout'
import { useMenuInit } from '@/hooks/useMenuInit'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MainLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default to desktop width
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
  })

  it('renders sidebar, header, breadcrumb, outlet, and command palette', () => {
    render(<MainLayout />)

    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument()
    expect(screen.getByTestId('outlet')).toBeInTheDocument()
    expect(screen.getByTestId('command-palette')).toBeInTheDocument()
  })

  it('calls useMenuInit hook', () => {
    render(<MainLayout />)
    expect(useMenuInit).toHaveBeenCalled()
  })

  it('renders skip-to-content link for accessibility', () => {
    render(<MainLayout />)
    expect(screen.getByText('Skip to content')).toBeInTheDocument()
  })

  it('sidebar is open by default on desktop (width >= 768)', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
    render(<MainLayout />)

    const sidebar = screen.getByTestId('sidebar')
    expect(sidebar.getAttribute('data-open')).toBe('true')
  })

  it('sidebar is closed by default on mobile (width < 768)', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 600 })
    render(<MainLayout />)

    const sidebar = screen.getByTestId('sidebar')
    expect(sidebar.getAttribute('data-open')).toBe('false')
  })

  it('opens sidebar when window is resized to desktop width', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 600 })
    render(<MainLayout />)

    // Sidebar should start closed on mobile
    expect(screen.getByTestId('sidebar').getAttribute('data-open')).toBe('false')

    // Resize to desktop
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })
      window.dispatchEvent(new Event('resize'))
    })

    expect(screen.getByTestId('sidebar').getAttribute('data-open')).toBe('true')
  })

  it('renders main content area with correct id', () => {
    render(<MainLayout />)
    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('id', 'main-content')
  })
})
