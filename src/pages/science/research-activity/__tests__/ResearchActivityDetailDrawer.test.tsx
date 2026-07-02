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

vi.mock('@/api/researchActivity.api', () => ({
  researchActivityApi: {
    getById: vi.fn().mockResolvedValue({
      id: 'RA001',
      universityCode: 'U001',
      universityName: 'Test University',
      educationYear: '2023-2024',
      scholarDatabaseName: 'Scopus',
      hIndex: 12,
      scientificWorkCount: 45,
      referenceCount: 300,
      link: 'https://scholar.example.org/u001',
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

import ResearchActivityDetailDrawer from '../ResearchActivityDetailDrawer'

describe('ResearchActivityDetailDrawer', () => {
  const defaultProps = { activityId: 'RA001', onClose: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the university name', async () => {
    render(<ResearchActivityDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getAllByText('Test University').length).toBeGreaterThan(0)
    })
  })

  it('shows the scholar database', async () => {
    render(<ResearchActivityDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getAllByText('Scopus').length).toBeGreaterThan(0)
    })
  })

  it('shows basic information section', async () => {
    render(<ResearchActivityDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Basic information')).toBeInTheDocument()
    })
  })

  it('shows error state on failure', async () => {
    const api = await import('@/api/researchActivity.api')
    vi.mocked(api.researchActivityApi.getById).mockRejectedValueOnce(new Error('Network error'))
    render(<ResearchActivityDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText(/Failed to load data/)).toBeInTheDocument()
    })
  })
})
