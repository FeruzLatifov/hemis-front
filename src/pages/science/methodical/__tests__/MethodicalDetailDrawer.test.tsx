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

vi.mock('@/api/methodical.api', () => ({
  methodicalApi: {
    getById: vi.fn().mockResolvedValue({
      id: 'M001',
      name: 'Physics manual',
      authors: 'B. Toshev',
      authorCounts: 2,
      publisher: 'University Press',
      issueYear: '2022',
      sourceName: 'Internal',
      universityCode: 'U001',
      universityName: 'Test University',
      methodicalTypeName: 'Manual',
      parameter: 'Approved',
      publicationDatabaseName: 'Local',
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

import MethodicalDetailDrawer from '../MethodicalDetailDrawer'

describe('MethodicalDetailDrawer', () => {
  const defaultProps = { methodicalId: 'M001', onClose: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the methodical name', async () => {
    render(<MethodicalDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getAllByText('Physics manual').length).toBeGreaterThan(0)
    })
  })

  it('shows the publisher', async () => {
    render(<MethodicalDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('University Press')).toBeInTheDocument()
    })
  })

  it('shows basic information section', async () => {
    render(<MethodicalDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Basic information')).toBeInTheDocument()
    })
  })

  it('shows close button in footer', async () => {
    render(<MethodicalDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getAllByText('Close').length).toBeGreaterThan(0)
    })
  })

  it('shows error state on failure', async () => {
    const api = await import('@/api/methodical.api')
    vi.mocked(api.methodicalApi.getById).mockRejectedValueOnce(new Error('Network error'))
    render(<MethodicalDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText(/Failed to load data/)).toBeInTheDocument()
    })
  })
})
