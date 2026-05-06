import { render, screen } from '@/test/test-utils'

// Mock react-i18next — return key as text so we can assert against English copy.
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

// Mock TanStack Query data hooks — the page wires them, but we only assert on
// the deterministic shell (header/title/columns), so empty-data fixtures are fine.
vi.mock('@/hooks/useStudents', () => ({
  useStudents: () => ({
    data: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 },
    isLoading: false,
    isError: false,
    error: null,
  }),
  useStudentStats: () => ({
    data: {
      total: 0,
      grantRecipients: 0,
      contractStudents: 0,
      graduates: 0,
      educationTypes: [],
      paymentForms: [],
    },
    isLoading: false,
  }),
  useStudentDictionaries: () => ({
    data: {
      courses: [],
      studentStatuses: [],
      paymentForms: [],
      educationTypes: [],
      educationForms: [],
      genders: [],
    },
    isLoading: false,
  }),
}))

import Students from '../StudentsPage'

describe('StudentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<Students />)
    expect(screen.getByText('Students')).toBeInTheDocument()
  })

  it('renders page title and description', () => {
    render(<Students />)
    expect(screen.getByText('Students')).toBeInTheDocument()
    expect(screen.getByText('Student list and management')).toBeInTheDocument()
  })

  it('renders summary stat cards', () => {
    render(<Students />)
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('Grant recipients')).toBeInTheDocument()
    expect(screen.getByText('Contract students')).toBeInTheDocument()
    expect(screen.getByText('Graduates')).toBeInTheDocument()
  })

  it('renders the search input with code placeholder by default', () => {
    render(<Students />)
    // Placeholder is composed at runtime — tolerate the trailing keyboard hint.
    expect(screen.getByPlaceholderText(/Search by code\.\.\./)).toBeInTheDocument()
  })

  it('renders the table column headers', () => {
    render(<Students />)
    expect(screen.getByText('Full name')).toBeInTheDocument()
    expect(screen.getByText('Course')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })
})
