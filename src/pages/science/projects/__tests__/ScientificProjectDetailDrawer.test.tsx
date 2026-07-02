import { render, screen, waitFor } from '@/test/test-utils'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'uz', changeLanguage: vi.fn(), on: vi.fn(), off: vi.fn() },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/api/scientificProjects.api', () => ({
  scientificProjectsApi: {
    getById: vi.fn().mockResolvedValue({
      id: 'P001',
      name: 'Nano research',
      projectNumber: 'PN-100',
      universityCode: 'U001',
      universityName: 'Test University',
      projectTypeName: 'Fundamental',
      contractNumber: 'CN-200',
      contractDate: '2023-01-05',
      startDate: '2023-01-01',
      endDate: '2024-12-31',
      department: 'Physics dept',
      localityName: 'Tashkent',
      projectCurrencyName: 'UZS',
      active: true,
    }),
  },
}))

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

import ScientificProjectDetailDrawer from '../ScientificProjectDetailDrawer'

describe('ScientificProjectDetailDrawer', () => {
  const defaultProps = { projectId: 'P001', onClose: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the project name', async () => {
    render(<ScientificProjectDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getAllByText('Nano research').length).toBeGreaterThan(0)
    })
  })

  it('shows the contract number', async () => {
    render(<ScientificProjectDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getAllByText('CN-200').length).toBeGreaterThan(0)
    })
  })

  it('shows basic information section', async () => {
    render(<ScientificProjectDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Basic information')).toBeInTheDocument()
    })
  })

  it('shows close button in footer', async () => {
    render(<ScientificProjectDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getAllByText('Close').length).toBeGreaterThan(0)
    })
  })

  it('shows error state on failure', async () => {
    const api = await import('@/api/scientificProjects.api')
    vi.mocked(api.scientificProjectsApi.getById).mockRejectedValueOnce(new Error('Network error'))
    render(<ScientificProjectDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText(/Failed to load data/)).toBeInTheDocument()
    })
  })
})
