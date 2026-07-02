import { render, screen } from '@/test/test-utils'
import type { ReportDto } from '@/api/reports.api'

// jsdom lacks ResizeObserver, which recharts' ResponsiveContainer requires.
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver

// Identity t() → assert on the raw English i18n keys.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn(), on: vi.fn(), off: vi.fn() },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

vi.mock('react-countup', () => ({
  default: ({ end }: { end: number }) => <span>{end}</span>,
}))

vi.mock('@/hooks/useUniversities', () => ({
  useUniversities: () => ({ data: { content: [] } }),
}))

vi.mock('@/hooks/useReports', () => ({ useAcademicReport: vi.fn() }))

import { useAcademicReport } from '@/hooks/useReports'
import AcademicReportPage from '../AcademicReportPage'

const mockUseAcademicReport = vi.mocked(useAcademicReport)

const mockData: ReportDto = {
  kpis: [
    { key: 'avgScore', label: 'Average score', value: 78 },
    { key: 'debtors', label: 'Debtors', value: 1200 },
    { key: 'avgAttendance', label: 'Average attendance', value: 91 },
    { key: 'universities', label: 'Universities covered', value: 42 },
  ],
  blocks: [
    {
      key: 'topByScore',
      title: 'Top universities by average score',
      viz: 'bar',
      categories: [{ label: 'Sample University', value: 88 }],
    },
    {
      key: 'byEducationType',
      title: 'By education type',
      viz: 'pie',
      categories: [{ label: 'Bachelor', value: 300 }],
    },
    {
      key: 'perUniversity',
      title: 'Per-university academic performance',
      viz: 'table',
      columns: [
        { key: 'university', label: 'University' },
        { key: 'averageScore', label: 'Average score' },
        { key: 'debtors', label: 'Debtors' },
      ],
      rows: [{ university: 'Sample University', averageScore: 88, debtors: 12 }],
    },
    {
      key: 'absentees',
      title: 'Absentee students',
      viz: 'bar',
      categories: [{ label: 'Sample University', value: 45 }],
    },
  ],
}

function mockReturn(overrides: Partial<ReturnType<typeof useAcademicReport>>) {
  mockUseAcademicReport.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useAcademicReport>)
}

describe('AcademicReportPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders KPI cards from report data', () => {
    mockReturn({ data: mockData })
    render(<AcademicReportPage />)
    expect(screen.getByText('Average attendance')).toBeInTheDocument()
    expect(screen.getByText('Universities covered')).toBeInTheDocument()
  })

  it('renders block titles for each viz and a table row', () => {
    mockReturn({ data: mockData })
    render(<AcademicReportPage />)
    expect(screen.getByText('Top universities by average score')).toBeInTheDocument()
    expect(screen.getByText('By education type')).toBeInTheDocument()
    expect(screen.getByText('Per-university academic performance')).toBeInTheDocument()
    expect(screen.getByText('Absentee students')).toBeInTheDocument()
    expect(screen.getByText('Sample University')).toBeInTheDocument()
  })

  it('renders the shared filter bar', () => {
    mockReturn({ data: mockData })
    render(<AcademicReportPage />)
    expect(screen.getByText('Education year')).toBeInTheDocument()
    expect(screen.getAllByText('University').length).toBeGreaterThanOrEqual(1)
  })

  it('shows a loading spinner while fetching', () => {
    mockReturn({ isLoading: true })
    const { container } = render(<AcademicReportPage />)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })
})
