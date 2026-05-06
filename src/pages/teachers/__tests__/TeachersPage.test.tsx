import { render, screen } from '@/test/test-utils'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params) {
        let result = key
        Object.entries(params).forEach(([k, v]) => {
          result = result.replace(`{{${k}}}`, String(v))
        })
        return result
      }
      return key
    },
    i18n: {
      language: 'uz',
      changeLanguage: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      off: vi.fn(),
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  }
})

import Teachers from '../TeachersPage'

// TeachersPage is currently a placeholder until the backend module ships;
// the tests pin the rendered "under development" copy so a regression in
// the placeholder is visible while we wait for the real feature.
describe('TeachersPage (placeholder)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<Teachers />)
    expect(screen.getByText('Teachers')).toBeInTheDocument()
  })

  it('renders page title and description', () => {
    render(<Teachers />)
    expect(screen.getByText('Teachers')).toBeInTheDocument()
    expect(screen.getByText('Teacher list and monitoring')).toBeInTheDocument()
  })

  it('renders the under-development empty state', () => {
    render(<Teachers />)
    expect(screen.getByText('This page is under development')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Teacher management features will be available once the backend API is ready',
      ),
    ).toBeInTheDocument()
  })
})
