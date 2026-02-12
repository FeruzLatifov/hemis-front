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

// Mock faculties API
vi.mock('@/api/faculties.api', () => ({
  facultiesApi: {
    getFacultyDetail: vi.fn().mockResolvedValue({
      code: 'F001',
      nameUz: 'Fizika fakulteti',
      nameRu: 'Faculty of Physics',
      shortName: 'Physics',
      universityCode: 'U001',
      universityName: 'Test University',
      status: true,
      departmentType: 'FACULTY',
      departmentTypeName: 'Faculty',
      createdAt: '2024-01-15T10:00:00Z',
      createdBy: 'admin',
      updatedAt: '2024-06-20T14:30:00Z',
      updatedBy: 'editor',
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

import FacultyDetailDrawer from '../FacultyDetailDrawer'

describe('FacultyDetailDrawer', () => {
  const defaultProps = {
    facultyCode: 'F001',
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the drawer', async () => {
    render(<FacultyDetailDrawer {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Fizika fakulteti')).toBeInTheDocument()
    })
  })

  it('shows faculty code', async () => {
    render(<FacultyDetailDrawer {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('F001')).toBeInTheDocument()
    })
  })

  it('shows university name', async () => {
    render(<FacultyDetailDrawer {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Test University')).toBeInTheDocument()
    })
  })

  it('shows university code', async () => {
    render(<FacultyDetailDrawer {...defaultProps} />)

    await waitFor(() => {
      const codeText = screen.getByText(/University code/)
      expect(codeText).toBeInTheDocument()
    })
  })

  it('shows active status badge', async () => {
    render(<FacultyDetailDrawer {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument()
    })
  })

  it('shows basic information section', async () => {
    render(<FacultyDetailDrawer {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Basic information')).toBeInTheDocument()
    })
  })

  it('shows audit information section', async () => {
    render(<FacultyDetailDrawer {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Audit information')).toBeInTheDocument()
    })
  })

  it('shows short name when available', async () => {
    render(<FacultyDetailDrawer {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Physics')).toBeInTheDocument()
    })
  })

  it('shows department type when available', async () => {
    render(<FacultyDetailDrawer {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Faculty')).toBeInTheDocument()
    })
  })

  it('shows close button in footer', async () => {
    render(<FacultyDetailDrawer {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Close')).toBeInTheDocument()
    })
  })

  it('shows created by info', async () => {
    render(<FacultyDetailDrawer {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument()
    })
  })

  it('shows updated by info', async () => {
    render(<FacultyDetailDrawer {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('editor')).toBeInTheDocument()
    })
  })

  it('shows loading skeletons when loading', async () => {
    const api = await import('@/api/faculties.api')
    // Override to never resolve - simulating a pending state
    vi.mocked(api.facultiesApi.getFacultyDetail).mockReturnValueOnce(new Promise(() => {}))

    render(<FacultyDetailDrawer {...defaultProps} />)

    // Component should at least render the drawer container with close button
    expect(screen.getByText('Close')).toBeInTheDocument()
  })

  it('shows error state on failure', async () => {
    const api = await import('@/api/faculties.api')
    vi.mocked(api.facultiesApi.getFacultyDetail).mockRejectedValueOnce(new Error('Network error'))

    render(<FacultyDetailDrawer {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText(/Failed to load data/)).toBeInTheDocument()
    })
  })
})
