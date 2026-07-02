import { render, screen } from '@/test/test-utils'
import type { ClassifierMetadata } from '@/api/classifiers.api'

// i18n: return keys verbatim so assertions can match English keys.
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
    i18n: { language: 'uz', changeLanguage: vi.fn(), on: vi.fn(), off: vi.fn() },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

// Mock the generic classifier hooks so the dedicated pages render deterministically
// without touching the network. Both classifiers are registered editable=true.
const META: ClassifierMetadata[] = [
  {
    apiKey: 'position',
    tableName: 'h_position',
    titleUz: 'Lavozimlar',
    titleRu: 'Должности',
    titleEn: 'Positions',
    category: 'EMPLOYEE',
    itemCount: 2,
    editable: true,
    hierarchical: false,
  },
  {
    apiKey: 'qualification',
    tableName: 'hemishe_h_qualification',
    titleUz: 'Malaka toifalari',
    titleRu: 'Категории квалификации',
    titleEn: 'Qualification categories',
    category: 'EMPLOYEE',
    itemCount: 1,
    editable: true,
    hierarchical: false,
  },
]

const ITEMS: Record<string, { code: string; name: string }> = {
  position: { code: 'PROF', name: 'Professor' },
  qualification: { code: 'HIGH', name: 'Highest category' },
}

vi.mock('@/hooks/useClassifiers', () => ({
  useClassifiersByCategory: () => ({ data: META, isLoading: false }),
  useClassifierItems: (apiKey: string) => ({
    data: {
      content: [{ ...ITEMS[apiKey], active: true, version: 1 }],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
      first: true,
      last: true,
      empty: false,
    },
    isLoading: false,
  }),
  useCreateClassifierItem: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateClassifierItem: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteClassifierItem: () => ({ mutate: vi.fn(), isPending: false }),
}))

import PositionsPage from '../positions/PositionsPage'
import QualificationsPage from '../qualifications/QualificationsPage'

describe('PositionsPage (position classifier deep-link)', () => {
  it('renders the page header', () => {
    render(<PositionsPage />, { useMemoryRouter: true })
    expect(screen.getByRole('heading', { name: 'Positions' })).toBeInTheDocument()
  })

  it('renders the position classifier items', () => {
    render(<PositionsPage />, { useMemoryRouter: true })
    expect(screen.getByText('Professor')).toBeInTheDocument()
    expect(screen.getByText('PROF')).toBeInTheDocument()
  })

  it('shows create/edit affordances because the classifier is editable', () => {
    render(<PositionsPage />, { useMemoryRouter: true })
    expect(screen.getByText('Add')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })
})

describe('QualificationsPage (qualification classifier deep-link)', () => {
  it('renders the page header', () => {
    render(<QualificationsPage />, { useMemoryRouter: true })
    expect(screen.getByRole('heading', { name: 'Qualifications' })).toBeInTheDocument()
  })

  it('renders the qualification classifier items', () => {
    render(<QualificationsPage />, { useMemoryRouter: true })
    expect(screen.getByText('Highest category')).toBeInTheDocument()
    expect(screen.getByText('HIGH')).toBeInTheDocument()
  })
})
