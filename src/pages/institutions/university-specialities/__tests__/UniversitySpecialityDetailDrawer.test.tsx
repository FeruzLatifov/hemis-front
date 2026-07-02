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

vi.mock('@/api/universitySpecialities.api', () => ({
  universitySpecialitiesApi: {
    getById: vi.fn().mockResolvedValue({
      id: 'US001',
      universityCode: 'U001',
      universityName: 'Test University',
      specialityCode: '5A123456',
      specialityName: 'Computer Science',
      educationTypeName: 'Bachelor',
      educationYear: '2023-2024',
      facultyCode: 'F01',
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

import UniversitySpecialityDetailDrawer from '../UniversitySpecialityDetailDrawer'

describe('UniversitySpecialityDetailDrawer', () => {
  const defaultProps = { specialityId: 'US001', onClose: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the speciality name', async () => {
    render(<UniversitySpecialityDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getAllByText('Computer Science').length).toBeGreaterThan(0)
    })
  })

  it('shows the education year', async () => {
    render(<UniversitySpecialityDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('2023-2024')).toBeInTheDocument()
    })
  })

  it('shows basic information section', async () => {
    render(<UniversitySpecialityDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('Basic information')).toBeInTheDocument()
    })
  })

  it('shows error state on failure', async () => {
    const api = await import('@/api/universitySpecialities.api')
    vi.mocked(api.universitySpecialitiesApi.getById).mockRejectedValueOnce(
      new Error('Network error'),
    )
    render(<UniversitySpecialityDetailDrawer {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText(/Failed to load data/)).toBeInTheDocument()
    })
  })
})
