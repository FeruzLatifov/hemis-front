import { render, screen } from '@/test/test-utils'
import type { ClassifierMetadata } from '@/api/classifiers.api'

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

vi.mock('@/hooks/useClassifiers', () => ({
  useClassifierItems: () => ({
    data: {
      content: [{ code: 'A1', name: 'Item A1', active: true, version: 1 }],
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

import ClassifierTablePanel from '../ClassifierTablePanel'

const baseMeta: ClassifierMetadata = {
  apiKey: 'position',
  tableName: 'h_position',
  titleUz: 'Lavozimlar',
  titleRu: 'Должности',
  titleEn: 'Positions',
  category: 'EMPLOYEE',
  itemCount: 1,
  editable: true,
  hierarchical: false,
}

describe('ClassifierTablePanel', () => {
  it('renders items and CRUD affordances when editable', () => {
    render(<ClassifierTablePanel classifier={baseMeta} />, { useMemoryRouter: true })
    expect(screen.getByText('Item A1')).toBeInTheDocument()
    expect(screen.getByText('Add')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  it('hides create/edit affordances when the classifier is read-only', () => {
    render(<ClassifierTablePanel classifier={{ ...baseMeta, editable: false }} />, {
      useMemoryRouter: true,
    })
    expect(screen.getByText('Item A1')).toBeInTheDocument()
    expect(screen.queryByText('Add')).not.toBeInTheDocument()
    expect(screen.queryByText('Actions')).not.toBeInTheDocument()
    expect(screen.getByText('Read only')).toBeInTheDocument()
  })
})
