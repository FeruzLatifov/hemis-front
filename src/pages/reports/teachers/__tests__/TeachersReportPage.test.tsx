import { render, screen } from '@/test/test-utils'
import type { ReportDto } from '@/api/reports.api'

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver

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

vi.mock('@/hooks/useReports', () => ({ useTeachersReport: vi.fn() }))

import { useTeachersReport } from '@/hooks/useReports'
import TeachersReportPage from '../TeachersReportPage'

const mockUse = vi.mocked(useTeachersReport)

const mockData: ReportDto = {
  kpis: [
    { key: 'total', label: 'Total teachers', value: 45000 },
    { key: 'phd', label: 'PhD holders', value: 12000 },
    { key: 'prof', label: 'Professors', value: 3000 },
  ],
  blocks: [
    {
      key: 'byAcademicDegree',
      title: 'By academic degree',
      viz: 'pie',
      categories: [{ label: 'PhD', value: 12000 }],
    },
    {
      key: 'byAgeBand',
      title: 'By age',
      viz: 'bar',
      categories: [{ label: '30-39', value: 15000 }],
    },
    {
      key: 'byUniversity',
      title: 'By university',
      viz: 'table',
      columns: [
        { key: 'university', label: 'University' },
        { key: 'count', label: 'Teachers count' },
      ],
      rows: [{ university: 'Sample University', count: 2500 }],
    },
  ],
}

function mockReturn(overrides: Partial<ReturnType<typeof useTeachersReport>>) {
  mockUse.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useTeachersReport>)
}

describe('TeachersReportPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders KPI cards', () => {
    mockReturn({ data: mockData })
    render(<TeachersReportPage />)
    expect(screen.getByText('Total teachers')).toBeInTheDocument()
    expect(screen.getByText('PhD holders')).toBeInTheDocument()
  })

  it('renders pie + bar block titles and the teachers table', () => {
    mockReturn({ data: mockData })
    render(<TeachersReportPage />)
    expect(screen.getByText('By academic degree')).toBeInTheDocument()
    expect(screen.getByText('By age')).toBeInTheDocument()
    expect(screen.getByText('By university')).toBeInTheDocument()
    expect(screen.getByText('Sample University')).toBeInTheDocument()
    expect(screen.getByText('2,500')).toBeInTheDocument()
  })
})
