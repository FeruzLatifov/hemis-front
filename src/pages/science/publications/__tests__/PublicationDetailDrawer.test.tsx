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

vi.mock('@/api/publications.api', () => ({
  publicationsApi: {
    getById: vi.fn().mockResolvedValue({
      id: 'PUB001',
      name: 'Deep learning study',
      authors: 'A. Karimov',
      authorCounts: 3,
      sourceName: 'Nature',
      issueYear: '2023',
      universityCode: 'U001',
      universityName: 'Test University',
      publicationTypeName: 'Article',
      doi: '10.1000/xyz',
      keywords: 'AI, ML',
      parameter: 'Q1',
      publicationDatabaseName: 'Scopus',
      educationYear: '2023-2024',
      isChecked: true,
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

import PublicationDetailDrawer from '../PublicationDetailDrawer'

describe('PublicationDetailDrawer', () => {
  const defaultProps = { publicationId: 'PUB001', onClose: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the publication name', async () => {
    render(<PublicationDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getAllByText('Deep learning study').length).toBeGreaterThan(0)
    })
  })

  it('shows the keywords', async () => {
    render(<PublicationDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('AI, ML')).toBeInTheDocument()
    })
  })

  it('shows basic information section', async () => {
    render(<PublicationDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Basic information')).toBeInTheDocument()
    })
  })

  it('shows close button in footer', async () => {
    render(<PublicationDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getAllByText('Close').length).toBeGreaterThan(0)
    })
  })

  it('shows error state on failure', async () => {
    const api = await import('@/api/publications.api')
    vi.mocked(api.publicationsApi.getById).mockRejectedValueOnce(new Error('Network error'))
    render(<PublicationDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText(/Failed to load data/)).toBeInTheDocument()
    })
  })
})
