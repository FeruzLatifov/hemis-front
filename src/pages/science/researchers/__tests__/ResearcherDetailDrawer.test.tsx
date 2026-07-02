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

vi.mock('@/api/researchers.api', () => ({
  researchersApi: {
    getById: vi.fn().mockResolvedValue({
      id: 'R001',
      fullName: 'Ali Valiev',
      studentIdNumber: 'SID-100',
      universityCode: 'U001',
      universityName: 'Test University',
      scienceBranchName: 'Physics',
      doctoralStudentTypeName: 'PhD',
      statusName: 'Studying',
      acceptedDate: '2023-09-01',
      dissertationTheme: 'Quantum computing',
      birthDate: '1995-01-01',
      level: 'Doctorate',
      department: 'Physics dept',
      paymentForm: 'Grant',
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

import ResearcherDetailDrawer from '../ResearcherDetailDrawer'

describe('ResearcherDetailDrawer', () => {
  const defaultProps = { researcherId: 'R001', onClose: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the researcher full name', async () => {
    render(<ResearcherDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getAllByText('Ali Valiev').length).toBeGreaterThan(0)
    })
  })

  it('shows the dissertation theme', async () => {
    render(<ResearcherDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Quantum computing')).toBeInTheDocument()
    })
  })

  it('shows basic information section', async () => {
    render(<ResearcherDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Basic information')).toBeInTheDocument()
    })
  })

  it('shows close button in footer', async () => {
    render(<ResearcherDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getAllByText('Close').length).toBeGreaterThan(0)
    })
  })

  it('shows error state on failure', async () => {
    const api = await import('@/api/researchers.api')
    vi.mocked(api.researchersApi.getById).mockRejectedValueOnce(new Error('Network error'))
    render(<ResearcherDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText(/Failed to load data/)).toBeInTheDocument()
    })
  })
})
