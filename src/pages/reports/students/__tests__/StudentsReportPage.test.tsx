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

vi.mock('@/hooks/useReports', () => ({ useStudentsReport: vi.fn() }))

import { useStudentsReport } from '@/hooks/useReports'
import StudentsReportPage from '../StudentsReportPage'

const mockUseStudentsReport = vi.mocked(useStudentsReport)

const mockData: ReportDto = {
  kpis: [
    { key: 'total', label: 'Total students', value: 500000 },
    { key: 'grant', label: 'Grant', value: 245830 },
    { key: 'male', label: 'Male', value: 260000 },
  ],
  blocks: [
    {
      key: 'byGender',
      title: 'By gender',
      viz: 'pie',
      categories: [
        { label: 'Male', value: 260000 },
        { label: 'Female', value: 193678 },
      ],
    },
    {
      key: 'byRegion',
      title: 'By region',
      viz: 'bar',
      categories: [{ label: 'Toshkent', value: 120000 }],
    },
    {
      key: 'topUniversities',
      title: 'Top universities',
      viz: 'table',
      columns: [
        { key: 'university', label: 'University' },
        { key: 'count', label: 'Students count' },
      ],
      rows: [{ university: 'Sample University', count: 25000 }],
    },
  ],
}

function mockReturn(overrides: Partial<ReturnType<typeof useStudentsReport>>) {
  mockUseStudentsReport.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useStudentsReport>)
}

describe('StudentsReportPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders KPI cards from report data', () => {
    mockReturn({ data: mockData })
    render(<StudentsReportPage />)
    expect(screen.getByText('Total students')).toBeInTheDocument()
    expect(screen.getByText('500000')).toBeInTheDocument()
  })

  it('renders block titles for each viz and a table row', () => {
    mockReturn({ data: mockData })
    render(<StudentsReportPage />)
    // Pie + bar + table block titles
    expect(screen.getByText('By gender')).toBeInTheDocument()
    expect(screen.getByText('By region')).toBeInTheDocument()
    expect(screen.getByText('Top universities')).toBeInTheDocument()
    // Table renders in jsdom regardless of recharts container sizing
    expect(screen.getByText('Sample University')).toBeInTheDocument()
    expect(screen.getByText('25,000')).toBeInTheDocument()
  })

  it('renders the shared filter bar', () => {
    mockReturn({ data: mockData })
    render(<StudentsReportPage />)
    expect(screen.getByText('Education year')).toBeInTheDocument()
    // 'University' appears both as filter label and table column header
    expect(screen.getAllByText('University').length).toBeGreaterThanOrEqual(1)
  })

  it('shows a loading spinner while fetching', () => {
    mockReturn({ isLoading: true })
    const { container } = render(<StudentsReportPage />)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })
})
