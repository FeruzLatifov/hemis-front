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

vi.mock('@/hooks/useReports', () => ({ useScientificReport: vi.fn() }))

import { useScientificReport } from '@/hooks/useReports'
import ScientificReportPage from '../ScientificReportPage'

const mockUse = vi.mocked(useScientificReport)

const mockData: ReportDto = {
  kpis: [
    { key: 'pubs', label: 'Total publications', value: 8500 },
    { key: 'projects', label: 'Total projects', value: 1200 },
    { key: 'doctoral', label: 'Doctoral students', value: 3400 },
  ],
  blocks: [
    {
      key: 'publicationsByType',
      title: 'Publications by type',
      viz: 'pie',
      categories: [{ label: 'Article', value: 5000 }],
    },
    {
      key: 'publicationsByUniversity',
      title: 'Publications by university',
      viz: 'table',
      columns: [
        { key: 'university', label: 'University' },
        { key: 'count', label: 'Publications' },
      ],
      rows: [{ university: 'Sample University', count: 900 }],
    },
  ],
}

function mockReturn(overrides: Partial<ReturnType<typeof useScientificReport>>) {
  mockUse.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useScientificReport>)
}

describe('ScientificReportPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders KPI cards', () => {
    mockReturn({ data: mockData })
    render(<ScientificReportPage />)
    expect(screen.getByText('Total publications')).toBeInTheDocument()
    expect(screen.getByText('Doctoral students')).toBeInTheDocument()
  })

  it('renders pie block title and publications table', () => {
    mockReturn({ data: mockData })
    render(<ScientificReportPage />)
    expect(screen.getByText('Publications by type')).toBeInTheDocument()
    expect(screen.getByText('Publications by university')).toBeInTheDocument()
    expect(screen.getByText('Sample University')).toBeInTheDocument()
  })

  it('renders empty state for a block with no categories', () => {
    mockReturn({
      data: {
        kpis: [],
        blocks: [
          { key: 'publicationsByType', title: 'Publications by type', viz: 'pie', categories: [] },
        ],
      },
    })
    render(<ScientificReportPage />)
    expect(screen.getByText('No report data available')).toBeInTheDocument()
  })
})
