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

vi.mock('@/api/scholarships.api', () => ({
  scholarshipsApi: {
    getById: vi.fn().mockResolvedValue({
      id: 'S001',
      studentName: 'Jane Roe',
      universityCode: 'U001',
      universityName: 'Test University',
      educationYear: '2024-2025',
      educationType: 'Bachelor',
      educationForm: 'Full-time',
      semester: '1',
      semesterNumber: 1,
      stipendCategory: 'State',
      stipendType: 'Regular',
      paymentForm: 'Monthly',
      decree: 'DCR-9',
      startDate: '2024-09-01',
      endDate: '2025-06-30',
      active: true,
      amounts: [{ month: '2024-09-01', amount: 700000 }],
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

import ScholarshipDetailDrawer from '../ScholarshipDetailDrawer'

describe('ScholarshipDetailDrawer', () => {
  const defaultProps = { scholarshipId: 'S001', onClose: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the student name', async () => {
    render(<ScholarshipDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getAllByText('Jane Roe').length).toBeGreaterThan(0)
    })
  })

  it('shows the scholarship category', async () => {
    render(<ScholarshipDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('State')).toBeInTheDocument()
    })
  })

  it('shows the monthly amounts section', async () => {
    render(<ScholarshipDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Monthly amounts')).toBeInTheDocument()
      expect(screen.getByText('700000')).toBeInTheDocument()
    })
  })

  it('shows basic information section', async () => {
    render(<ScholarshipDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Basic information')).toBeInTheDocument()
    })
  })

  it('shows close button in footer', async () => {
    render(<ScholarshipDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getAllByText('Close').length).toBeGreaterThan(0)
    })
  })

  it('shows error state on failure', async () => {
    const api = await import('@/api/scholarships.api')
    vi.mocked(api.scholarshipsApi.getById).mockRejectedValueOnce(new Error('Network error'))
    render(<ScholarshipDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText(/Failed to load data/)).toBeInTheDocument()
    })
  })
})
