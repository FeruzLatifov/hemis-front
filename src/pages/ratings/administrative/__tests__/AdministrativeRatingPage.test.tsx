import { render, screen } from '@/test/test-utils'
import type { ReportDto } from '@/api/ratings.api'

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

vi.mock('@/hooks/useRatings', () => ({ useAdministrativeRating: vi.fn() }))

import { useAdministrativeRating } from '@/hooks/useRatings'
import AdministrativeRatingPage from '../AdministrativeRatingPage'

const mockUseAdministrativeRating = vi.mocked(useAdministrativeRating)

const mockData: ReportDto = {
  kpis: [
    { key: 'ranked', label: 'Universities ranked', value: 230 },
    { key: 'top', label: 'Top university', value: 1 },
    { key: 'indicators', label: 'Indicators', value: 12500 },
  ],
  blocks: [
    {
      key: 'leaderboard',
      title: 'By university',
      viz: 'table',
      columns: [
        { key: 'rank', label: 'Rank' },
        { key: 'university', label: 'University' },
        { key: 'indicators', label: 'Indicators' },
      ],
      rows: [
        { rank: 1, university: 'Top University', indicators: 900 },
        { rank: 2, university: 'Second University', indicators: 800 },
      ],
    },
    {
      key: 'topByTotal',
      title: 'Top universities',
      viz: 'bar',
      categories: [{ label: 'Top University', value: 900 }],
    },
  ],
}

function mockReturn(overrides: Partial<ReturnType<typeof useAdministrativeRating>>) {
  mockUseAdministrativeRating.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useAdministrativeRating>)
}

describe('AdministrativeRatingPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders KPI cards from rating data', () => {
    mockReturn({ data: mockData })
    render(<AdministrativeRatingPage />)
    expect(screen.getByText('Universities ranked')).toBeInTheDocument()
    expect(screen.getByText('230')).toBeInTheDocument()
  })

  it('renders the ranked leaderboard table', () => {
    mockReturn({ data: mockData })
    render(<AdministrativeRatingPage />)
    expect(screen.getByText('Rank')).toBeInTheDocument()
    expect(screen.getByText('Top University')).toBeInTheDocument()
    expect(screen.getByText('Second University')).toBeInTheDocument()
  })

  it('shows a loading spinner while fetching', () => {
    mockReturn({ isLoading: true })
    const { container } = render(<AdministrativeRatingPage />)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })
})
