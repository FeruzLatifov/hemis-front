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

import Reports from '../ReportsPage'

describe('ReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<Reports />)
    expect(screen.getByText('Reports')).toBeInTheDocument()
  })

  it('renders page title and subtitle', () => {
    render(<Reports />)
    expect(screen.getByText('Reports')).toBeInTheDocument()
    expect(screen.getByText('Reports subtitle')).toBeInTheDocument()
  })

  it('renders action buttons', () => {
    render(<Reports />)
    expect(screen.getByText('Select academic year')).toBeInTheDocument()
    expect(screen.getByText('All reports')).toBeInTheDocument()
  })

  it('renders quick stats cards', () => {
    render(<Reports />)
    expect(screen.getByText('General reports')).toBeInTheDocument()
    expect(screen.getByText('156')).toBeInTheDocument()
    expect(screen.getByText('Monthly reports')).toBeInTheDocument()
    expect(screen.getByText('24')).toBeInTheDocument()
    expect(screen.getByText('Downloaded')).toBeInTheDocument()
    expect(screen.getByText('3,456')).toBeInTheDocument()
    expect(screen.getByText('Last update')).toBeInTheDocument()
    expect(screen.getByText('Today, 08:00')).toBeInTheDocument()
  })

  it('renders student reports category', () => {
    render(<Reports />)
    expect(screen.getByText('Student reports')).toBeInTheDocument()
    expect(screen.getByText('Student statistics')).toBeInTheDocument()
    expect(screen.getByText('Total students count and distribution')).toBeInTheDocument()
    expect(screen.getByText('By education type')).toBeInTheDocument()
    expect(screen.getByText('By payment type')).toBeInTheDocument()
    expect(screen.getByText('By region')).toBeInTheDocument()
  })

  it('renders teacher reports category', () => {
    render(<Reports />)
    expect(screen.getByText('Teacher reports')).toBeInTheDocument()
    expect(screen.getByText('By scientific degrees')).toBeInTheDocument()
    expect(screen.getByText('By academic titles')).toBeInTheDocument()
    expect(screen.getByText('By experience')).toBeInTheDocument()
    expect(screen.getByText('By departments')).toBeInTheDocument()
  })

  it('renders university reports category', () => {
    render(<Reports />)
    expect(screen.getByText('University reports')).toBeInTheDocument()
    expect(screen.getByText('General indicators')).toBeInTheDocument()
    expect(screen.getByText('By rating')).toBeInTheDocument()
    expect(screen.getByText('By organizational form')).toBeInTheDocument()
    expect(screen.getByText('Form of ownership')).toBeInTheDocument()
  })

  it('renders scientific activity category', () => {
    render(<Reports />)
    expect(screen.getByText('Scientific activity')).toBeInTheDocument()
    expect(screen.getByText('Scientific publications')).toBeInTheDocument()
    expect(screen.getByText('Scientific projects')).toBeInTheDocument()
    expect(screen.getByText('Dissertation defenses')).toBeInTheDocument()
    expect(screen.getByText('Intellectual property')).toBeInTheDocument()
  })

  it('renders report count badges for each category', () => {
    render(<Reports />)
    // Each category has 4 reports, shown as "4 reports"
    const reportCounts = screen.getAllByText('4 reports')
    expect(reportCounts).toHaveLength(4)
  })

  it('renders parameter count badges for reports', () => {
    render(<Reports />)
    // Various parameter counts appear as badges
    expect(screen.getAllByText('12 parameters').length).toBeGreaterThan(0)
    expect(screen.getAllByText('8 parameters').length).toBeGreaterThan(0)
    expect(screen.getAllByText('6 parameters').length).toBeGreaterThan(0)
  })

  it('renders view buttons for each report', () => {
    render(<Reports />)
    // Each report row has a "View" button
    const viewButtons = screen.getAllByText('View')
    // 4 categories x 4 reports = 16 view buttons
    expect(viewButtons).toHaveLength(16)
  })

  it('renders report descriptions', () => {
    render(<Reports />)
    expect(screen.getByText('Bachelor, Master, PhD distribution')).toBeInTheDocument()
    expect(screen.getByText('Grant and contract students')).toBeInTheDocument()
    expect(screen.getByText('Distribution by regions')).toBeInTheDocument()
    expect(screen.getByText('Doctor of Science, PhD, DSc')).toBeInTheDocument()
    expect(screen.getByText('Scopus, Web of Science publications')).toBeInTheDocument()
    expect(screen.getByText('Patents, licenses')).toBeInTheDocument()
  })
})
