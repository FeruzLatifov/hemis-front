import { render, screen } from '@/test/test-utils'
import type { ReportDto } from '@/api/ratings.api'

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

vi.mock('@/hooks/useRatings', () => ({ useAcademicRating: vi.fn() }))

import { useAcademicRating } from '@/hooks/useRatings'
import AcademicRatingPage from '../AcademicRatingPage'

const mockUseAcademicRating = vi.mocked(useAcademicRating)

const mockData: ReportDto = {
  kpis: [
    { key: 'avg', label: 'Average score', value: 78 },
    { key: 'top', label: 'Top university', value: 1 },
    { key: 'debtors', label: 'Debtors', value: 4200 },
  ],
  blocks: [
    {
      key: 'leaderboard',
      title: 'By university',
      viz: 'table',
      columns: [
        { key: 'rank', label: 'Rank' },
        { key: 'university', label: 'University' },
        { key: 'avg', label: 'Average score' },
        { key: 'debtors', label: 'Debtors' },
      ],
      rows: [{ rank: 1, university: 'Alpha University', avg: 92, debtors: 10 }],
    },
    {
      key: 'topByAvg',
      title: 'Top universities',
      viz: 'bar',
      categories: [{ label: 'Alpha University', value: 92 }],
    },
  ],
}

function mockReturn(overrides: Partial<ReturnType<typeof useAcademicRating>>) {
  mockUseAcademicRating.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useAcademicRating>)
}

describe('AcademicRatingPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders KPI cards from rating data', () => {
    mockReturn({ data: mockData })
    render(<AcademicRatingPage />)
    // 'Average score' is both a KPI label and a table column header.
    expect(screen.getAllByText('Average score').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('78')).toBeInTheDocument()
  })

  it('renders the ranked leaderboard table', () => {
    mockReturn({ data: mockData })
    render(<AcademicRatingPage />)
    expect(screen.getByText('Rank')).toBeInTheDocument()
    expect(screen.getByText('Alpha University')).toBeInTheDocument()
  })

  it('shows a loading spinner while fetching', () => {
    mockReturn({ isLoading: true })
    const { container } = render(<AcademicRatingPage />)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })
})
