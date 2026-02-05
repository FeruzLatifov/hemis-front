import { render, screen } from '@/test/test-utils'

// Mock react-i18next - must include initReactI18next for i18n/config.ts
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'uz', changeLanguage: vi.fn(), on: vi.fn(), off: vi.fn() },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock useUniversities hook
const mockUniversityData = {
  code: 'U001',
  name: 'Test University',
  tin: '123456789',
  region: 'Tashkent',
  address: '123 Test Street',
  mailAddress: 'test@university.uz',
  soatoRegion: 'Tashkent Region',
  terrain: 'Urban',
  cadastre: 'CAD-001',
  ownership: 'State',
  universityType: 'Higher Education',
  versionType: 'V1',
  contractCategory: 'Category A',
  activityStatus: 'Active',
  belongsTo: 'Ministry',
  parentUniversity: null,
  universityUrl: 'https://test-university.uz',
  teacherUrl: 'https://teacher.test-university.uz',
  studentUrl: 'https://student.test-university.uz',
  uzbmbUrl: null,
  gpaEdit: true,
  accreditationEdit: true,
  addStudent: false,
  allowGrouping: true,
  allowTransferOutside: false,
  active: true,
  bankInfo: 'Bank XYZ, Account: 12345',
  accreditationInfo: 'Accredited until 2025',
}

vi.mock('@/hooks/useUniversities', () => ({
  useUniversity: vi.fn(() => ({
    data: mockUniversityData,
    isLoading: false,
    isError: false,
  })),
}))

// Mock url util
vi.mock('@/utils/url.util', () => ({
  sanitizeUrl: (url: string | null | undefined) => {
    if (!url) return null
    try {
      const parsed = new URL(url)
      if (['http:', 'https:'].includes(parsed.protocol)) return parsed.href
      return null
    } catch {
      return null
    }
  },
}))

import UniversityDetailDrawer from '../UniversityDetailDrawer'

describe('UniversityDetailDrawer', () => {
  const defaultProps = {
    code: 'U001',
    open: true,
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders detail view when open', () => {
    render(<UniversityDetailDrawer {...defaultProps} />)

    expect(screen.getByText('Institution details')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<UniversityDetailDrawer {...defaultProps} open={false} />)

    expect(screen.queryByText('Institution details')).not.toBeInTheDocument()
  })

  it('shows university name', () => {
    render(<UniversityDetailDrawer {...defaultProps} />)

    // Name appears in header subtitle and in the body
    const elements = screen.getAllByText('Test University')
    expect(elements.length).toBeGreaterThan(0)
  })

  it('shows university code', () => {
    render(<UniversityDetailDrawer {...defaultProps} />)

    expect(screen.getByText('U001')).toBeInTheDocument()
  })

  it('shows INN', () => {
    render(<UniversityDetailDrawer {...defaultProps} />)

    expect(screen.getByText('123456789')).toBeInTheDocument()
  })

  it('shows address section', () => {
    render(<UniversityDetailDrawer {...defaultProps} />)

    expect(screen.getByText('Address and location')).toBeInTheDocument()
    expect(screen.getByText('123 Test Street')).toBeInTheDocument()
  })

  it('shows region', () => {
    render(<UniversityDetailDrawer {...defaultProps} />)

    // Multiple instances possible since region appears in different sections
    const regionLabels = screen.getAllByText('Tashkent')
    expect(regionLabels.length).toBeGreaterThan(0)
  })

  it('shows organizational info', () => {
    render(<UniversityDetailDrawer {...defaultProps} />)

    expect(screen.getByText('Organizational info')).toBeInTheDocument()
    expect(screen.getByText('State')).toBeInTheDocument()
    expect(screen.getByText('Higher Education')).toBeInTheDocument()
  })

  it('shows websites section with links', () => {
    render(<UniversityDetailDrawer {...defaultProps} />)

    expect(screen.getByText('Websites')).toBeInTheDocument()
  })

  it('shows settings flags', () => {
    render(<UniversityDetailDrawer {...defaultProps} />)

    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('GPA edit')).toBeInTheDocument()
    expect(screen.getByText('Accreditation edit')).toBeInTheDocument()
    expect(screen.getByText('Add student')).toBeInTheDocument()
    expect(screen.getByText('Allow grouping')).toBeInTheDocument()
    expect(screen.getByText('External transfer')).toBeInTheDocument()
  })

  it('shows active status', () => {
    render(<UniversityDetailDrawer {...defaultProps} />)

    // "Active" appears in multiple places (settings section and status)
    const elements = screen.getAllByText('Active')
    expect(elements.length).toBeGreaterThan(0)
  })

  it('shows additional info', () => {
    render(<UniversityDetailDrawer {...defaultProps} />)

    expect(screen.getByText('Additional info')).toBeInTheDocument()
    expect(screen.getByText('Bank XYZ, Account: 12345')).toBeInTheDocument()
    expect(screen.getByText('Accredited until 2025')).toBeInTheDocument()
  })

  it('shows close button in footer', () => {
    render(<UniversityDetailDrawer {...defaultProps} />)

    const closeButtons = screen.getAllByText('Close')
    expect(closeButtons.length).toBeGreaterThan(0)
  })

  it('shows loading state when data is loading', async () => {
    const hooks = await import('@/hooks/useUniversities')
    vi.mocked(hooks.useUniversity).mockReturnValueOnce({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof hooks.useUniversity>)

    render(<UniversityDetailDrawer {...defaultProps} />)

    expect(screen.getByText('Data is loading')).toBeInTheDocument()
  })

  it('shows error state when data fails to load', async () => {
    const hooks = await import('@/hooks/useUniversities')
    vi.mocked(hooks.useUniversity).mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof hooks.useUniversity>)

    render(<UniversityDetailDrawer {...defaultProps} />)

    expect(screen.getByText('Failed to load data')).toBeInTheDocument()
  })
})
