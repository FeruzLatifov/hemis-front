import { render, screen, fireEvent } from '@/test/test-utils'

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

  it('renders action buttons', () => {
    render(<Students />)
    expect(screen.getByText('Import')).toBeInTheDocument()
    expect(screen.getByText('Export')).toBeInTheDocument()
    expect(screen.getByText('New student')).toBeInTheDocument()
  })

  it('renders stats summary cards', () => {
    render(<Students />)
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('Grant recipients')).toBeInTheDocument()
    expect(screen.getByText('Contract students')).toBeInTheDocument()
    // Note: "Graduates" text appears in stats card
    const graduatesElements = screen.getAllByText('Graduates')
    expect(graduatesElements.length).toBeGreaterThan(0)
  })

  it('renders search and filter section', () => {
    render(<Students />)
    expect(screen.getByText('Search and filter')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search by full name, code, PINFL...')).toBeInTheDocument()
  })

  it('renders student list table with headers', () => {
    render(<Students />)
    expect(screen.getByText('Student list')).toBeInTheDocument()
    expect(screen.getByText('Code')).toBeInTheDocument()
    expect(screen.getByText('Full name')).toBeInTheDocument()
    expect(screen.getByText('PINFL')).toBeInTheDocument()
    expect(screen.getByText('Universities')).toBeInTheDocument()
    expect(screen.getByText('Specialty')).toBeInTheDocument()
    expect(screen.getByText('Course')).toBeInTheDocument()
    expect(screen.getByText('Education type')).toBeInTheDocument()
    expect(screen.getByText('Payment')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  it('renders student rows with data', () => {
    render(<Students />)

    // Check that student data appears in the table
    expect(screen.getByText('ST2024001')).toBeInTheDocument()
    expect(screen.getByText('Ahmadov Sardor Akmalovich')).toBeInTheDocument()
    expect(screen.getByText('12345678901234')).toBeInTheDocument()

    expect(screen.getByText('ST2024002')).toBeInTheDocument()
    expect(screen.getByText('Karimova Nilufar Shavkatovna')).toBeInTheDocument()

    expect(screen.getByText('ST2024003')).toBeInTheDocument()
    expect(screen.getByText('Rahimov Bobur Olimovich')).toBeInTheDocument()
  })

  it('renders student count text', () => {
    render(<Students />)
    expect(screen.getByText('5 students found')).toBeInTheDocument()
  })

  it('renders status badges for active students', () => {
    render(<Students />)
    const activeBadges = screen.getAllByText('Active')
    expect(activeBadges.length).toBe(5)
  })

  it('renders payment form badges', () => {
    render(<Students />)
    const grantBadges = screen.getAllByText('Grant')
    expect(grantBadges.length).toBeGreaterThan(0)
    const contractBadges = screen.getAllByText('Contract')
    expect(contractBadges.length).toBeGreaterThan(0)
  })

  it('renders education type badges', () => {
    render(<Students />)
    const bakalavrBadges = screen.getAllByText('Bakalavr')
    expect(bakalavrBadges.length).toBeGreaterThan(0)
    expect(screen.getByText('Magistr')).toBeInTheDocument()
  })

  it('renders pagination controls', () => {
    render(<Students />)
    expect(screen.getByText('Previous')).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
    expect(screen.getByText('Showing 1-5 of 453,678 students')).toBeInTheDocument()
  })

  it('renders column configuration button', () => {
    render(<Students />)
    expect(screen.getByText('Configure columns')).toBeInTheDocument()
  })

  it('allows typing in the search input', () => {
    render(<Students />)
    const searchInput = screen.getByPlaceholderText('Search by full name, code, PINFL...')
    fireEvent.change(searchInput, { target: { value: 'Ahmadov' } })
    expect(searchInput).toHaveValue('Ahmadov')
  })

  it('renders university badges in table rows', () => {
    render(<Students />)
    const tdtuBadges = screen.getAllByText('TDTU')
    expect(tdtuBadges.length).toBeGreaterThan(0)
  })
})
