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

vi.mock('@/api/certificates.api', () => ({
  certificatesApi: {
    getById: vi.fn().mockResolvedValue({
      id: 'C001',
      studentName: 'Alan Turing',
      universityCode: 'U001',
      universityName: 'Test University',
      certificateType: 'IELTS',
      certificateTypeName: 'IELTS',
      certificateName: 'CN-1',
      certificateNameLabel: 'English',
      certificateGrade: 'A',
      certificateGradeName: 'Excellent',
      certificateSubject: 'ENG',
      certificateSubjectName: 'English language',
      serialNumber: 'SN-777',
      issueDate: '2024-01-15',
      validDate: '2026-01-15',
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

import CertificateDetailDrawer from '../CertificateDetailDrawer'

describe('CertificateDetailDrawer', () => {
  const defaultProps = { certificateId: 'C001', onClose: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the student name', async () => {
    render(<CertificateDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Alan Turing')).toBeInTheDocument()
    })
  })

  it('shows the serial number', async () => {
    render(<CertificateDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getAllByText('SN-777').length).toBeGreaterThan(0)
    })
  })

  it('shows the certificate subject label', async () => {
    render(<CertificateDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('English language')).toBeInTheDocument()
    })
  })

  it('shows basic information section', async () => {
    render(<CertificateDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Basic information')).toBeInTheDocument()
    })
  })

  it('shows close button in footer', async () => {
    render(<CertificateDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getAllByText('Close').length).toBeGreaterThan(0)
    })
  })

  it('shows error state on failure', async () => {
    const api = await import('@/api/certificates.api')
    vi.mocked(api.certificatesApi.getById).mockRejectedValueOnce(new Error('Network error'))
    render(<CertificateDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText(/Failed to load data/)).toBeInTheDocument()
    })
  })
})
