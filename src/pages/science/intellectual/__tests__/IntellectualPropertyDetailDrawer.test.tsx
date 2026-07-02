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

vi.mock('@/api/intellectual.api', () => ({
  intellectualApi: {
    getById: vi.fn().mockResolvedValue({
      id: 'IP001',
      name: 'Smart Sensor',
      authors: 'B. Tosheva',
      authorCounts: 2,
      universityCode: 'U001',
      universityName: 'Test University',
      patentTypeName: 'Utility model',
      numbers: 'UZ-12345',
      propertyDate: '2022-03-01',
      countryCode: 'UZ',
      parameter: 'A1',
      publicationDatabaseName: 'Espacenet',
      educationYear: '2022-2023',
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

import IntellectualPropertyDetailDrawer from '../IntellectualPropertyDetailDrawer'

describe('IntellectualPropertyDetailDrawer', () => {
  const defaultProps = { propertyId: 'IP001', onClose: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the property name', async () => {
    render(<IntellectualPropertyDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getAllByText('Smart Sensor').length).toBeGreaterThan(0)
    })
  })

  it('shows the patent number', async () => {
    render(<IntellectualPropertyDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('UZ-12345')).toBeInTheDocument()
    })
  })

  it('shows basic information section', async () => {
    render(<IntellectualPropertyDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Basic information')).toBeInTheDocument()
    })
  })

  it('shows error state on failure', async () => {
    const api = await import('@/api/intellectual.api')
    vi.mocked(api.intellectualApi.getById).mockRejectedValueOnce(new Error('Network error'))
    render(<IntellectualPropertyDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText(/Failed to load data/)).toBeInTheDocument()
    })
  })
})
