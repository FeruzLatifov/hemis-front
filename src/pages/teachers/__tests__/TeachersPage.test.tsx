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

import Teachers from '../TeachersPage'

describe('TeachersPage', () => {
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

  it('renders action buttons', () => {
    render(<Teachers />)
    expect(screen.getByText('Export')).toBeInTheDocument()
    expect(screen.getByText('New teacher')).toBeInTheDocument()
  })

  it('renders stats cards', () => {
    render(<Teachers />)
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('Professors')).toBeInTheDocument()
    expect(screen.getByText('Associate professors')).toBeInTheDocument()
    expect(screen.getByText('Doctor of science')).toBeInTheDocument()
    expect(screen.getByText('PhD/DSc')).toBeInTheDocument()
  })

  it('renders stats values', () => {
    render(<Teachers />)
    expect(screen.getByText('45,234')).toBeInTheDocument()
    expect(screen.getByText('3,456')).toBeInTheDocument()
    expect(screen.getByText('8,923')).toBeInTheDocument()
    expect(screen.getByText('2,145')).toBeInTheDocument()
    expect(screen.getByText('5,678')).toBeInTheDocument()
  })

  it('renders search and filter section', () => {
    render(<Teachers />)
    expect(screen.getByText('Search and filter')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Search by full name, PINFL, department...'),
    ).toBeInTheDocument()
  })

  it('renders teacher list table with headers', () => {
    render(<Teachers />)
    expect(screen.getByText('Teacher list')).toBeInTheDocument()
    expect(screen.getByText('Code')).toBeInTheDocument()
    expect(screen.getByText('Full name')).toBeInTheDocument()
    expect(screen.getByText('Universities')).toBeInTheDocument()
    expect(screen.getByText('Department')).toBeInTheDocument()
    expect(screen.getByText('Position')).toBeInTheDocument()
    // Academic degree appears in both filter select and table header
    expect(screen.getAllByText('Academic degree').length).toBeGreaterThanOrEqual(2)
    // Academic title appears in both filter select and table header
    expect(screen.getAllByText('Academic title').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('Experience')).toBeInTheDocument()
    expect(screen.getByText('Publications')).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  it('renders teacher rows with data', () => {
    render(<Teachers />)

    // Check first teacher data
    expect(screen.getByText('TC2024001')).toBeInTheDocument()
    expect(screen.getByText('Prof. Rahimov Anvar Shavkatovich')).toBeInTheDocument()

    // Check second teacher data
    expect(screen.getByText('TC2024002')).toBeInTheDocument()
    expect(screen.getByText('Dots. Karimova Dilbar Azizovna')).toBeInTheDocument()

    // Check third teacher
    expect(screen.getByText('TC2024003')).toBeInTheDocument()
    expect(screen.getByText('Dr. Aliyev Javohir Murodovich')).toBeInTheDocument()
  })

  it('renders teacher count text', () => {
    render(<Teachers />)
    expect(screen.getByText('5 teachers found')).toBeInTheDocument()
  })

  it('renders academic degree badges', () => {
    render(<Teachers />)
    expect(screen.getByText('Fan doktori')).toBeInTheDocument()
    expect(screen.getByText('Fan nomzodi')).toBeInTheDocument()
    expect(screen.getByText('PhD')).toBeInTheDocument()
    expect(screen.getByText('DSc')).toBeInTheDocument()
  })

  it('renders academic rank and position badges', () => {
    render(<Teachers />)
    // Professor appears in stats card label, position badges, and rank badges
    const professorElements = screen.getAllByText('Professor')
    expect(professorElements.length).toBeGreaterThan(0)
    // Dotsent appears in both position and rank columns
    const dotsentElements = screen.getAllByText('Dotsent')
    expect(dotsentElements.length).toBeGreaterThan(0)
    expect(screen.getByText("Katta o'qituvchi")).toBeInTheDocument()
    expect(screen.getByText('Assistent')).toBeInTheDocument()
  })

  it('renders experience values', () => {
    render(<Teachers />)
    expect(screen.getByText('25 years')).toBeInTheDocument()
    expect(screen.getByText('18 years')).toBeInTheDocument()
    expect(screen.getByText('8 years')).toBeInTheDocument()
    expect(screen.getByText('3 years')).toBeInTheDocument()
    expect(screen.getByText('30 years')).toBeInTheDocument()
  })

  it('renders publications count', () => {
    render(<Teachers />)
    expect(screen.getByText('45')).toBeInTheDocument()
    expect(screen.getByText('32')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('78')).toBeInTheDocument()
  })

  it('renders projects count', () => {
    render(<Teachers />)
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
  })

  it('renders university badges', () => {
    render(<Teachers />)
    const tdtuBadges = screen.getAllByText('TDTU')
    expect(tdtuBadges.length).toBeGreaterThan(0)
  })

  it('renders pagination controls', () => {
    render(<Teachers />)
    expect(screen.getByText('Previous')).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
    expect(screen.getByText('Showing 1-5 of 45,234 teachers')).toBeInTheDocument()
  })

  it('allows typing in the search input', () => {
    render(<Teachers />)
    const searchInput = screen.getByPlaceholderText('Search by full name, PINFL, department...')
    fireEvent.change(searchInput, { target: { value: 'Rahimov' } })
    expect(searchInput).toHaveValue('Rahimov')
  })

  it('renders dash for teachers without degree', () => {
    render(<Teachers />)
    // Tursunov has no degree - should show "-"
    const dashes = screen.getAllByText('-')
    expect(dashes.length).toBeGreaterThan(0)
  })
})
