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

vi.mock('@/hooks/useRatings', () => ({ useGpaRating: vi.fn() }))

import { useGpaRating } from '@/hooks/useRatings'
import GpaRatingPage from '../GpaRatingPage'

const mockUseGpaRating = vi.mocked(useGpaRating)

const mockData: ReportDto = {
  kpis: [
    { key: 'avg', label: 'Average GPA', value: 3 },
    { key: 'top', label: 'Top university', value: 1 },
    { key: 'students', label: 'Students counted', value: 480000 },
  ],
  blocks: [
    {
      key: 'leaderboard',
      title: 'By university',
      viz: 'table',
      columns: [
        { key: 'rank', label: 'Rank' },
        { key: 'university', label: 'University' },
        { key: 'avg', label: 'Average GPA' },
        { key: 'students', label: 'Students counted' },
      ],
      rows: [{ rank: 1, university: 'Gold University', avg: 4, students: 12000 }],
    },
    {
      key: 'topByGpa',
      title: 'Top universities',
      viz: 'bar',
      categories: [{ label: 'Gold University', value: 4 }],
    },
  ],
}

function mockReturn(overrides: Partial<ReturnType<typeof useGpaRating>>) {
  mockUseGpaRating.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useGpaRating>)
}

describe('GpaRatingPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the accent-gold headline KPI', () => {
    mockReturn({ data: mockData })
    render(<GpaRatingPage />)
    // Both labels appear as a KPI label and a table column header.
    expect(screen.getAllByText('Average GPA').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Students counted').length).toBeGreaterThanOrEqual(1)
  })

  it('renders the ranked leaderboard table', () => {
    mockReturn({ data: mockData })
    render(<GpaRatingPage />)
    expect(screen.getByText('Rank')).toBeInTheDocument()
    expect(screen.getByText('Gold University')).toBeInTheDocument()
  })

  it('shows a loading spinner while fetching', () => {
    mockReturn({ isLoading: true })
    const { container } = render(<GpaRatingPage />)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })
})
