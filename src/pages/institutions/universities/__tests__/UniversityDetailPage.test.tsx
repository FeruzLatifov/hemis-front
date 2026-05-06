import { render, screen } from '@/test/test-utils'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'uz', changeLanguage: vi.fn(), on: vi.fn(), off: vi.fn() },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ code: 'TATU' }),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  }
})

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}))

vi.mock('@/hooks/useUniversities', () => ({
  useUniversity: () => ({
    data: {
      code: 'TATU',
      name: 'TATU University',
      tin: '123456789',
      address: 'Tashkent',
      active: true,
      activityStatusCode: 'ACTIVE',
    },
    isLoading: false,
  }),
}))

vi.mock('@/hooks/useUniversity', () => ({
  useUniversityDashboard: () => ({ data: undefined, isLoading: false }),
  useUniversityOfficials: () => ({ data: [], isLoading: false }),
  useUniversityProfile: () => ({ data: undefined, isLoading: false }),
}))

import UniversityDetailPage from '../UniversityDetailPage'

describe('UniversityDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the university name in the header', () => {
    render(<UniversityDetailPage />)
    // The name appears in both the page title and the breadcrumb-style sub-header.
    expect(screen.getAllByText('TATU University').length).toBeGreaterThan(0)
  })

  it('renders the edit affordance in the header', () => {
    render(<UniversityDetailPage />)
    // The header back button is icon-only (ArrowLeft); only Edit has visible text.
    expect(screen.getByText('Edit')).toBeInTheDocument()
  })

  it('does not show the not-found state when the record exists', () => {
    render(<UniversityDetailPage />)
    expect(screen.queryByText('University not found')).not.toBeInTheDocument()
  })
})
