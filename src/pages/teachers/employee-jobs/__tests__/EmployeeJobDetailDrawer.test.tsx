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

vi.mock('@/api/employeeJobs.api', () => ({
  employeeJobsApi: {
    getById: vi.fn().mockResolvedValue({
      id: 'EJ001',
      employeeName: 'Karim Aliyev',
      universityCode: 'U001',
      universityName: 'Test University',
      departmentName: 'IT Department',
      employeeTypeName: 'Professor',
      positionName: 'Dean',
      employeeFormName: 'Full-time',
      rate: 1,
      jobStartDate: '2020-01-01',
      jobEndDate: '2024-01-01',
      contractNumber: 'C-100',
      decreeNumber: 'D-200',
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

import EmployeeJobDetailDrawer from '../EmployeeJobDetailDrawer'

describe('EmployeeJobDetailDrawer', () => {
  const defaultProps = { employeeJobId: 'EJ001', onClose: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the employee name', async () => {
    render(<EmployeeJobDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getAllByText('Karim Aliyev').length).toBeGreaterThan(0)
    })
  })

  it('shows the contract number', async () => {
    render(<EmployeeJobDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('C-100')).toBeInTheDocument()
    })
  })

  it('shows basic information section', async () => {
    render(<EmployeeJobDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Basic information')).toBeInTheDocument()
    })
  })

  it('shows error state on failure', async () => {
    const api = await import('@/api/employeeJobs.api')
    vi.mocked(api.employeeJobsApi.getById).mockRejectedValueOnce(new Error('Network error'))
    render(<EmployeeJobDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText(/Failed to load data/)).toBeInTheDocument()
    })
  })
})
