import { render, screen } from '@/test/test-utils'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params) {
        let result = key
        Object.entries(params).forEach(([k, v]) => {
          result = result.replace(`{{${k}}}`, String(v))
        })
        return result
      }
      return key
    },
    i18n: {
      language: 'uz',
      changeLanguage: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      off: vi.fn(),
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

// Mock react-countup
vi.mock('react-countup', () => ({
  default: ({ end }: { end: number }) => <span>{end}</span>,
}))

// Mock i18n config (imported directly in DashboardPage)
vi.mock('@/i18n/config', () => ({
  default: {
    language: 'uz',
    changeLanguage: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}))

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 hours ago'),
}))

vi.mock('date-fns/locale', () => ({
  uz: {},
  ru: {},
  enUS: {},
}))

// Mock dashboard API
const mockDashboardData = {
  timestamp: '2024-01-01T00:00:00Z',
  overview: {
    totalStudents: 500000,
    totalTeachers: 45000,
    totalUniversities: 226,
    totalDiplomas: 90000,
    totalProjects: 1200,
    totalPublications: 8500,
    activeStudents: 453678,
    graduatedStudents: 89456,
    expelledStudents: 1200,
    academicLeaveStudents: 3400,
    cancelledStudents: 500,
    grantStudents: 245830,
    contractStudents: 207848,
    maleCount: 260000,
    femaleCount: 193678,
  },
  students: {
    byEducationForm: [],
    byRegion: [],
    byLanguage: [],
  },
  educationTypes: [
    { code: 'B', name: 'Bakalavr', count: 420000 },
    { code: 'M', name: 'Magistr', count: 30000 },
    { code: 'O', name: 'Ordinatura', count: 3678 },
  ],
  topUniversities: [
    {
      rank: 1,
      code: 'TDTU',
      name: 'Toshkent Davlat Texnika Universiteti',
      studentCount: 25000,
      maleCount: 15000,
      femaleCount: 10000,
      grantCount: 12000,
      contractCount: 13000,
    },
    {
      rank: 2,
      code: 'TATU',
      name: 'Toshkent Axborot Texnologiyalari Universiteti',
      studentCount: 22000,
      maleCount: 14000,
      femaleCount: 8000,
      grantCount: 11000,
      contractCount: 11000,
    },
  ],
  recentActivities: [
    {
      type: 'student',
      action: 'New student enrolled',
      name: 'Ahmadov Sardor',
      time: '2024-01-01T10:00:00Z',
    },
    {
      type: 'teacher',
      action: 'Teacher added',
      name: 'Prof. Karimov',
      time: '2024-01-01T09:00:00Z',
    },
  ],
}

// Mock @tanstack/react-query
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: vi.fn(),
  }
})

import { useQuery } from '@tanstack/react-query'
import Dashboard from '../DashboardPage'

const mockUseQuery = vi.mocked(useQuery)

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isError: false,
    } as ReturnType<typeof useQuery>)

    const { container } = render(<Dashboard />)

    // Loading spinner is shown (Loader2 with animate-spin class)
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('renders error state', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('API error'),
      isError: true,
    } as ReturnType<typeof useQuery>)

    render(<Dashboard />)

    expect(screen.getByText('Failed to load data')).toBeInTheDocument()
    expect(screen.getByText('Please refresh the page')).toBeInTheDocument()
  })

  it('renders dashboard title when data is loaded', () => {
    mockUseQuery.mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
      isError: false,
    } as ReturnType<typeof useQuery>)

    render(<Dashboard />)

    expect(screen.getByText('STATISTICS')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Monitoring and analysis of higher education system of the Republic of Uzbekistan',
      ),
    ).toBeInTheDocument()
  })

  it('renders stats cards with correct labels', () => {
    mockUseQuery.mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
      isError: false,
    } as ReturnType<typeof useQuery>)

    render(<Dashboard />)

    // Primary stats cards
    expect(screen.getByText('Currently studying')).toBeInTheDocument()
    expect(screen.getByText('Graduates')).toBeInTheDocument()
    expect(screen.getByText('Expelled')).toBeInTheDocument()
    expect(screen.getByText('Total Teachers')).toBeInTheDocument()

    // CountUp renders the number values - use getAllByText for values that may appear multiple times
    expect(screen.getByText('453678')).toBeInTheDocument()
    expect(screen.getByText('89456')).toBeInTheDocument()
    expect(screen.getByText('45000')).toBeInTheDocument()
    // 1200 appears in both expelled and scientific projects, so use getAllByText
    expect(screen.getAllByText('1200').length).toBeGreaterThanOrEqual(1)
  })

  it('renders secondary stats cards', () => {
    mockUseQuery.mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
      isError: false,
    } as ReturnType<typeof useQuery>)

    render(<Dashboard />)

    expect(screen.getByText('Academic Leave')).toBeInTheDocument()
    expect(screen.getByText('Cancelled')).toBeInTheDocument()
    expect(screen.getByText('Total HEIs')).toBeInTheDocument()
    expect(screen.getByText('Issued Diplomas')).toBeInTheDocument()
  })

  it('renders education types section', () => {
    mockUseQuery.mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
      isError: false,
    } as ReturnType<typeof useQuery>)

    render(<Dashboard />)

    expect(screen.getByText('Education types')).toBeInTheDocument()
    expect(screen.getByText('Distribution by education levels')).toBeInTheDocument()
    expect(screen.getByText('Bakalavr')).toBeInTheDocument()
    expect(screen.getByText('Magistr')).toBeInTheDocument()
    expect(screen.getByText('Ordinatura')).toBeInTheDocument()
  })

  it('renders top universities section', () => {
    mockUseQuery.mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
      isError: false,
    } as ReturnType<typeof useQuery>)

    render(<Dashboard />)

    expect(screen.getByText('TOP Universities')).toBeInTheDocument()
    expect(screen.getByText('Top 5 by rating')).toBeInTheDocument()
    expect(screen.getByText('Toshkent Davlat Texnika Universiteti')).toBeInTheDocument()
    expect(screen.getByText('Toshkent Axborot Texnologiyalari Universiteti')).toBeInTheDocument()
  })

  it('renders recent activity section', () => {
    mockUseQuery.mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
      isError: false,
    } as ReturnType<typeof useQuery>)

    render(<Dashboard />)

    expect(screen.getByText('Recent activity')).toBeInTheDocument()
    expect(screen.getByText('Changes in last 24 hours')).toBeInTheDocument()
    expect(screen.getByText('New student enrolled')).toBeInTheDocument()
    expect(screen.getByText('Teacher added')).toBeInTheDocument()
  })

  it('renders quick info section', () => {
    mockUseQuery.mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
      isError: false,
    } as ReturnType<typeof useQuery>)

    render(<Dashboard />)

    expect(screen.getByText('Quick info')).toBeInTheDocument()
    expect(screen.getByText('Grant students')).toBeInTheDocument()
    expect(screen.getByText('Contract students')).toBeInTheDocument()
    expect(screen.getByText('Scientific projects')).toBeInTheDocument()
    expect(screen.getByText('Scientific publications')).toBeInTheDocument()
  })

  it('renders academic year badge and report button', () => {
    mockUseQuery.mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
      isError: false,
    } as ReturnType<typeof useQuery>)

    render(<Dashboard />)

    expect(screen.getByText(/2024\/2025/)).toBeInTheDocument()
    expect(screen.getByText('Get report')).toBeInTheDocument()
  })
})
