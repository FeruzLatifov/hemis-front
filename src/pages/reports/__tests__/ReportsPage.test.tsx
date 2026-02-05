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
    expect(screen.getByText('Bugun, 08:00')).toBeInTheDocument()
  })

  it('renders student reports category', () => {
    render(<Reports />)
    expect(screen.getByText('Talabalar hisobotlari')).toBeInTheDocument()
    expect(screen.getByText('Talabalar statistikasi')).toBeInTheDocument()
    expect(screen.getByText('Umumiy talabalar soni va taqsimlash')).toBeInTheDocument()
    expect(screen.getByText("Ta'lim turlari bo'yicha")).toBeInTheDocument()
    expect(screen.getByText("To'lov shakli bo'yicha")).toBeInTheDocument()
    expect(screen.getByText('Hududlar kesimida')).toBeInTheDocument()
  })

  it('renders teacher reports category', () => {
    render(<Reports />)
    expect(screen.getByText("O'qituvchilar hisobotlari")).toBeInTheDocument()
    expect(screen.getByText('Ilmiy darajalar kesimida')).toBeInTheDocument()
    expect(screen.getByText("Ilmiy unvonlar bo'yicha")).toBeInTheDocument()
    expect(screen.getByText("Tajriba bo'yicha")).toBeInTheDocument()
    expect(screen.getByText("Kafedralar bo'yicha")).toBeInTheDocument()
  })

  it('renders university reports category', () => {
    render(<Reports />)
    expect(screen.getByText('Universitetlar hisobotlari')).toBeInTheDocument()
    expect(screen.getByText("Umumiy ko'rsatkichlar")).toBeInTheDocument()
    expect(screen.getByText("Reyting bo'yicha")).toBeInTheDocument()
    expect(screen.getByText("Tashkiliy shakl bo'yicha")).toBeInTheDocument()
    expect(screen.getByText('Mulkchilik shakli')).toBeInTheDocument()
  })

  it('renders scientific activity category', () => {
    render(<Reports />)
    expect(screen.getByText('Ilmiy faoliyat')).toBeInTheDocument()
    expect(screen.getByText('Ilmiy nashrlar')).toBeInTheDocument()
    expect(screen.getByText('Ilmiy loyihalar')).toBeInTheDocument()
    expect(screen.getByText('Dissertasiya himoyalari')).toBeInTheDocument()
    expect(screen.getByText('Intellektual mulk')).toBeInTheDocument()
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
    expect(screen.getAllByText('12 parametr').length).toBeGreaterThan(0)
    expect(screen.getAllByText('8 parametr').length).toBeGreaterThan(0)
    expect(screen.getAllByText('6 parametr').length).toBeGreaterThan(0)
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
    expect(screen.getByText('Bakalavr, Magistr, PhD taqsimlash')).toBeInTheDocument()
    expect(screen.getByText('Grant va kontrakt talabalar')).toBeInTheDocument()
    expect(screen.getByText("Viloyatlar bo'yicha taqsimlash")).toBeInTheDocument()
    expect(screen.getByText('Fan doktori, PhD, DSc')).toBeInTheDocument()
    expect(screen.getByText('Scopus, Web of Science nashrlari')).toBeInTheDocument()
    expect(screen.getByText('Patentlar, litsenziyalar')).toBeInTheDocument()
  })
})
