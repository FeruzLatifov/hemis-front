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

vi.mock('@/api/dissertationDefense.api', () => ({
  dissertationDefenseApi: {
    getById: vi.fn().mockResolvedValue({
      id: 'DD001',
      studentName: 'Aziz Rustamov',
      universityCode: 'U001',
      universityName: 'Test University',
      specialityCode: '5A99',
      diplomaNumber: 'DN-500',
      registerNumber: 'RN-600',
      defenseDate: '2023-05-10',
      defensePlace: 'Tashkent',
      approvedDate: '2023-06-01',
      diplomaGivenByWhom: 'Ministry',
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

import DissertationDefenseDetailDrawer from '../DissertationDefenseDetailDrawer'

describe('DissertationDefenseDetailDrawer', () => {
  const defaultProps = { defenseId: 'DD001', onClose: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the student name', async () => {
    render(<DissertationDefenseDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getAllByText('Aziz Rustamov').length).toBeGreaterThan(0)
    })
  })

  it('shows the defense place', async () => {
    render(<DissertationDefenseDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Tashkent')).toBeInTheDocument()
    })
  })

  it('shows basic information section', async () => {
    render(<DissertationDefenseDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Basic information')).toBeInTheDocument()
    })
  })

  it('shows error state on failure', async () => {
    const api = await import('@/api/dissertationDefense.api')
    vi.mocked(api.dissertationDefenseApi.getById).mockRejectedValueOnce(new Error('Network error'))
    render(<DissertationDefenseDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText(/Failed to load data/)).toBeInTheDocument()
    })
  })
})
