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

vi.mock('@/hooks/useReports', () => ({ useEconomicReport: vi.fn() }))

import { useEconomicReport } from '@/hooks/useReports'
import EconomicReportPage from '../EconomicReportPage'

const mockUseEconomicReport = vi.mocked(useEconomicReport)

const mockData: ReportDto = {
  kpis: [
    { key: 'graduates', label: 'Total graduates', value: 84000 },
    { key: 'laboratories', label: 'Laboratories', value: 3200 },
    { key: 'ict', label: 'ICT equipment', value: 15000 },
  ],
  blocks: [
    {
      key: 'graduatesByYear',
      title: 'Graduates by year',
      viz: 'bar',
      categories: [{ label: '2025', value: 84000 }],
    },
    {
      key: 'byGender',
      title: 'By gender',
      viz: 'pie',
      categories: [{ label: 'Male', value: 42000 }],
    },
    {
      key: 'byWorkplaceCompatibility',
      title: 'By workplace compatibility',
      viz: 'pie',
      categories: [{ label: 'Compatible', value: 60000 }],
    },
    {
      key: 'topByGraduates',
      title: 'Top universities by graduate count',
      viz: 'table',
      columns: [
        { key: 'university', label: 'University' },
        { key: 'graduates', label: 'Total graduates' },
      ],
      rows: [{ university: 'Sample University', graduates: 5000 }],
    },
    {
      key: 'labsByUniversity',
      title: 'Laboratories by university',
      viz: 'bar',
      categories: [{ label: 'Sample University', value: 120 }],
    },
  ],
}

function mockReturn(overrides: Partial<ReturnType<typeof useEconomicReport>>) {
  mockUseEconomicReport.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useEconomicReport>)
}

describe('EconomicReportPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders KPI cards from report data', () => {
    mockReturn({ data: mockData })
    render(<EconomicReportPage />)
    // 'Total graduates' is both a KPI label and a table column header.
    expect(screen.getAllByText('Total graduates').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Laboratories')).toBeInTheDocument()
    expect(screen.getByText('ICT equipment')).toBeInTheDocument()
  })

  it('renders block titles for each viz and a table row', () => {
    mockReturn({ data: mockData })
    render(<EconomicReportPage />)
    expect(screen.getByText('Graduates by year')).toBeInTheDocument()
    expect(screen.getByText('By gender')).toBeInTheDocument()
    expect(screen.getByText('By workplace compatibility')).toBeInTheDocument()
    expect(screen.getByText('Top universities by graduate count')).toBeInTheDocument()
    expect(screen.getByText('Laboratories by university')).toBeInTheDocument()
    expect(screen.getByText('Sample University')).toBeInTheDocument()
  })

  it('renders the shared filter bar', () => {
    mockReturn({ data: mockData })
    render(<EconomicReportPage />)
    expect(screen.getByText('Education year')).toBeInTheDocument()
    expect(screen.getAllByText('University').length).toBeGreaterThanOrEqual(1)
  })

  it('shows a loading spinner while fetching', () => {
    mockReturn({ isLoading: true })
    const { container } = render(<EconomicReportPage />)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })
})
