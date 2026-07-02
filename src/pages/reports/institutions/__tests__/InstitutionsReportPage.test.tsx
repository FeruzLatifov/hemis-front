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

vi.mock('@/hooks/useReports', () => ({ useInstitutionsReport: vi.fn() }))

import { useInstitutionsReport } from '@/hooks/useReports'
import InstitutionsReportPage from '../InstitutionsReportPage'

const mockUse = vi.mocked(useInstitutionsReport)

const mockData: ReportDto = {
  kpis: [
    { key: 'total', label: 'Total institutions', value: 226 },
    { key: 'faculties', label: 'Faculties', value: 1800 },
    { key: 'cathedras', label: 'Cathedras', value: 5400 },
  ],
  blocks: [
    {
      key: 'byOwnership',
      title: 'By ownership',
      viz: 'pie',
      categories: [{ label: 'State', value: 120 }],
    },
    {
      key: 'universityStructure',
      title: 'University structure',
      viz: 'table',
      columns: [
        { key: 'university', label: 'University' },
        { key: 'faculties', label: 'Faculties' },
        { key: 'cathedras', label: 'Cathedras' },
      ],
      rows: [{ university: 'Sample University', faculties: 12, cathedras: 40 }],
    },
  ],
}

function mockReturn(overrides: Partial<ReturnType<typeof useInstitutionsReport>>) {
  mockUse.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useInstitutionsReport>)
}

describe('InstitutionsReportPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders KPI cards', () => {
    mockReturn({ data: mockData })
    render(<InstitutionsReportPage />)
    expect(screen.getByText('Total institutions')).toBeInTheDocument()
    expect(screen.getByText('226')).toBeInTheDocument()
  })

  it('renders pie block title and table structure', () => {
    mockReturn({ data: mockData })
    render(<InstitutionsReportPage />)
    expect(screen.getByText('By ownership')).toBeInTheDocument()
    expect(screen.getByText('University structure')).toBeInTheDocument()
    expect(screen.getByText('Sample University')).toBeInTheDocument()
  })

  it('renders error state with retry', () => {
    mockReturn({ isError: true })
    render(<InstitutionsReportPage />)
    expect(screen.getByText('Failed to load data')).toBeInTheDocument()
  })
})
