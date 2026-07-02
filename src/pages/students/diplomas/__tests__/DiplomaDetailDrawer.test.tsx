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

vi.mock('@/api/diplomas.api', () => ({
  diplomasApi: {
    getById: vi.fn().mockResolvedValue({
      id: 'D001',
      diplomaNumber: 'DN-100',
      registerNumber: 'RN-200',
      registerDate: '2024-05-01',
      studentName: 'John Doe',
      universityCode: 'U001',
      universityName: 'Test University',
      specialityName: 'Computer Science',
      specialityCode: '5330100',
      educationType: 'Bachelor',
      educationYear: '2024-2025',
      admissionYear: '2020',
      graduationDate: '2024-06-30',
      avgGrade: 4.5,
      totalCredit: 240,
      verify: true,
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

import DiplomaDetailDrawer from '../DiplomaDetailDrawer'

describe('DiplomaDetailDrawer', () => {
  const defaultProps = { diplomaId: 'D001', onClose: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the diploma number', async () => {
    render(<DiplomaDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getAllByText('DN-100').length).toBeGreaterThan(0)
    })
  })

  it('shows the student name', async () => {
    render(<DiplomaDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
  })

  it('shows the speciality name', async () => {
    render(<DiplomaDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Computer Science')).toBeInTheDocument()
    })
  })

  it('shows basic information section', async () => {
    render(<DiplomaDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Basic information')).toBeInTheDocument()
    })
  })

  it('shows close button in footer', async () => {
    render(<DiplomaDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getAllByText('Close').length).toBeGreaterThan(0)
    })
  })

  it('shows error state on failure', async () => {
    const api = await import('@/api/diplomas.api')
    vi.mocked(api.diplomasApi.getById).mockRejectedValueOnce(new Error('Network error'))
    render(<DiplomaDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText(/Failed to load data/)).toBeInTheDocument()
    })
  })
})
