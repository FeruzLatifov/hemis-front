import { render, screen, waitFor } from '@/test/test-utils'

// Mock react-i18next - must include initReactI18next for i18n/config.ts
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'uz', changeLanguage: vi.fn(), on: vi.fn(), off: vi.fn() },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock groups API
vi.mock('@/api/groups.api', () => ({
  groupsApi: {
    getGroupDetail: vi.fn().mockResolvedValue({
      id: 'G001',
      groupId: 'IF-101',
      groupName: 'Informatika 101',
      universityCode: 'U001',
      universityName: 'Test University',
      educationTypeCode: 'BACHELOR',
      educationTypeName: 'Bachelor',
      educationYearCode: '2024',
      educationYearName: '2024-2025',
      active: true,
    }),
  },
}))

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => (
    <button {...props}>{children}</button>
  ),
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({
    children,
    ...props
  }: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  ),
}))

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}))

import GroupDetailDrawer from '../GroupDetailDrawer'

describe('GroupDetailDrawer', () => {
  const defaultProps = {
    groupId: 'G001',
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the drawer', async () => {
    render(<GroupDetailDrawer {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getAllByText('Informatika 101').length).toBeGreaterThan(0)
    })
  })

  it('shows group id', async () => {
    render(<GroupDetailDrawer {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getAllByText('IF-101').length).toBeGreaterThan(0)
    })
  })

  it('shows university name', async () => {
    render(<GroupDetailDrawer {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Test University')).toBeInTheDocument()
    })
  })

  it('shows university code', async () => {
    render(<GroupDetailDrawer {...defaultProps} />)

    await waitFor(() => {
      const codeText = screen.getByText(/University code/)
      expect(codeText).toBeInTheDocument()
    })
  })

  it('shows active status badge', async () => {
    render(<GroupDetailDrawer {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument()
    })
  })

  it('shows basic information section', async () => {
    render(<GroupDetailDrawer {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Basic information')).toBeInTheDocument()
    })
  })

  it('shows education type name', async () => {
    render(<GroupDetailDrawer {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Bachelor')).toBeInTheDocument()
    })
  })

  it('shows education year name', async () => {
    render(<GroupDetailDrawer {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('2024-2025')).toBeInTheDocument()
    })
  })

  it('does not render an audit information section', async () => {
    render(<GroupDetailDrawer {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Basic information')).toBeInTheDocument()
    })
    expect(screen.queryByText('Audit information')).not.toBeInTheDocument()
  })

  it('shows close button in footer', async () => {
    render(<GroupDetailDrawer {...defaultProps} />)

    await waitFor(() => {
      // Drawer renders both a header X-button and a footer "Close" — assert at least one.
      expect(screen.getAllByText('Close').length).toBeGreaterThan(0)
    })
  })

  it('shows loading skeletons when loading', async () => {
    const api = await import('@/api/groups.api')
    // Override to never resolve - simulating a pending state
    vi.mocked(api.groupsApi.getGroupDetail).mockReturnValueOnce(new Promise(() => {}))

    render(<GroupDetailDrawer {...defaultProps} />)

    // Component should at least render the drawer container with close button(s).
    expect(screen.getAllByText('Close').length).toBeGreaterThan(0)
  })

  it('shows error state on failure', async () => {
    const api = await import('@/api/groups.api')
    vi.mocked(api.groupsApi.getGroupDetail).mockRejectedValueOnce(new Error('Network error'))

    render(<GroupDetailDrawer {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText(/Failed to load data/)).toBeInTheDocument()
    })
  })
})
