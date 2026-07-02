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

vi.mock('@/hooks/useRatings', () => ({ useScientificRating: vi.fn() }))

import { useScientificRating } from '@/hooks/useRatings'
import ScientificRatingPage from '../ScientificRatingPage'

const mockUseScientificRating = vi.mocked(useScientificRating)

const mockData: ReportDto = {
  kpis: [
    { key: 'publications', label: 'Total publications', value: 15000 },
    { key: 'projects', label: 'Total projects', value: 3200 },
    { key: 'top', label: 'Top university', value: 1 },
  ],
  blocks: [
    {
      key: 'leaderboard',
      title: 'By university',
      viz: 'table',
      columns: [
        { key: 'rank', label: 'Rank' },
        { key: 'university', label: 'University' },
        { key: 'publications', label: 'Publications' },
        { key: 'projects', label: 'Projects' },
        { key: 'doctoral', label: 'Doctoral students' },
        { key: 'total', label: 'Total' },
      ],
      rows: [
        {
          rank: 1,
          university: 'Science University',
          publications: 900,
          projects: 200,
          doctoral: 40,
          total: 1140,
        },
      ],
    },
    {
      key: 'topByTotal',
      title: 'Top universities',
      viz: 'bar',
      categories: [{ label: 'Science University', value: 1140 }],
    },
  ],
}

function mockReturn(overrides: Partial<ReturnType<typeof useScientificRating>>) {
  mockUseScientificRating.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useScientificRating>)
}

describe('ScientificRatingPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders KPI cards from rating data', () => {
    mockReturn({ data: mockData })
    render(<ScientificRatingPage />)
    expect(screen.getByText('Total publications')).toBeInTheDocument()
    expect(screen.getByText('15000')).toBeInTheDocument()
  })

  it('renders the ranked leaderboard table', () => {
    mockReturn({ data: mockData })
    render(<ScientificRatingPage />)
    expect(screen.getByText('Rank')).toBeInTheDocument()
    expect(screen.getByText('Science University')).toBeInTheDocument()
    expect(screen.getByText('Doctoral students')).toBeInTheDocument()
  })

  it('shows a loading spinner while fetching', () => {
    mockReturn({ isLoading: true })
    const { container } = render(<ScientificRatingPage />)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })
})
