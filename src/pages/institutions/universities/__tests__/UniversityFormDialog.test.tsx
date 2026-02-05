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

// Mock authStore
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector?: (state: Record<string, unknown>) => unknown) => {
    const state = {
      isAuthenticated: true,
      user: { name: 'Admin', locale: 'uz' },
      permissions: ['admin'],
    }
    return selector ? selector(state) : state
  }),
}))

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}))

// Mock universities API
vi.mock('@/api/universities.api', () => ({
  universitiesApi: {
    createUniversity: vi.fn().mockResolvedValue({}),
    updateUniversity: vi.fn().mockResolvedValue({}),
  },
  UniversityRow: {},
}))

// Mock useUniversities hooks
vi.mock('@/hooks/useUniversities', () => ({
  useUniversityDictionaries: vi.fn(() => ({
    data: {
      regions: [{ code: 'R1', name: 'Tashkent' }],
      ownerships: [{ code: 'O1', name: 'State' }],
      types: [{ code: 'T1', name: 'University' }],
    },
    isLoading: false,
  })),
}))

// Mock error util
vi.mock('@/utils/error.util', () => ({
  extractApiErrorMessage: vi.fn((err: unknown, fallback: string) => fallback),
}))

// Mock radix dialog components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? (
      <div data-testid="dialog" role="dialog">
        {children}
      </div>
    ) : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="dialog-title">{children}</h2>
  ),
}))

// Mock tabs
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsContent: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  ),
  TabsList: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tabs-list">{children}</div>
  ),
  TabsTrigger: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <button data-testid={`tab-trigger-${value}`}>{children}</button>
  ),
}))

// Mock UI components
vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement> & { ref?: unknown }) => {
    const { ref: _inputRef, ...rest } = props
    void _inputRef
    return <input {...rest} />
  },
}))

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: { children: React.ReactNode; htmlFor?: string }) => (
    <label {...props}>{children}</label>
  ),
}))

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: unknown }) => {
    const { ref: _textareaRef, ...rest } = props
    void _textareaRef
    return <textarea {...rest} />
  },
}))

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({
    id,
    checked,
  }: {
    id?: string
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
  }) => <input type="checkbox" id={id} checked={checked} readOnly data-testid={`checkbox-${id}`} />,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) => {
    const { ...rest } = props
    return <button {...rest}>{children}</button>
  },
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({
    children,
  }: {
    children: React.ReactNode
    value?: string
    onValueChange?: (v: string) => void
  }) => <div data-testid="select">{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-trigger">{children}</div>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
}))

import UniversityFormDialog from '../UniversityFormDialog'

describe('UniversityFormDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onSuccess: vi.fn(),
    university: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dialog when open', () => {
    render(<UniversityFormDialog {...defaultProps} />)

    expect(screen.getByTestId('dialog')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<UniversityFormDialog {...defaultProps} open={false} />)

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
  })

  it('shows Add new HEI title when creating', () => {
    render(<UniversityFormDialog {...defaultProps} />)

    expect(screen.getByText('Add new HEI')).toBeInTheDocument()
  })

  it('shows Edit HEI title when editing', () => {
    const university = {
      code: 'U001',
      name: 'Test University',
      active: true,
    }

    render(
      <UniversityFormDialog
        {...defaultProps}
        university={university as Parameters<typeof UniversityFormDialog>[0]['university']}
      />,
    )

    expect(screen.getByText('Edit HEI')).toBeInTheDocument()
  })

  it('shows form fields for code and name', () => {
    render(<UniversityFormDialog {...defaultProps} />)

    expect(screen.getByPlaceholderText('00001')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Full name of HEI')).toBeInTheDocument()
  })

  it('shows INN field', () => {
    render(<UniversityFormDialog {...defaultProps} />)

    expect(screen.getByPlaceholderText('123456789')).toBeInTheDocument()
  })

  it('has tab navigation', () => {
    render(<UniversityFormDialog {...defaultProps} />)

    expect(screen.getByTestId('tab-trigger-basic')).toBeInTheDocument()
    expect(screen.getByTestId('tab-trigger-location')).toBeInTheDocument()
    expect(screen.getByTestId('tab-trigger-urls')).toBeInTheDocument()
    expect(screen.getByTestId('tab-trigger-settings')).toBeInTheDocument()
    expect(screen.getByTestId('tab-trigger-additional')).toBeInTheDocument()
  })

  it('shows tab content sections', () => {
    render(<UniversityFormDialog {...defaultProps} />)

    expect(screen.getByTestId('tab-content-basic')).toBeInTheDocument()
    expect(screen.getByTestId('tab-content-location')).toBeInTheDocument()
    expect(screen.getByTestId('tab-content-urls')).toBeInTheDocument()
    expect(screen.getByTestId('tab-content-settings')).toBeInTheDocument()
    expect(screen.getByTestId('tab-content-additional')).toBeInTheDocument()
  })

  it('has submit (Create) button', () => {
    render(<UniversityFormDialog {...defaultProps} />)

    expect(screen.getByText('Create')).toBeInTheDocument()
  })

  it('has Save button when editing', () => {
    const university = {
      code: 'U001',
      name: 'Test University',
      active: true,
    }

    render(
      <UniversityFormDialog
        {...defaultProps}
        university={university as Parameters<typeof UniversityFormDialog>[0]['university']}
      />,
    )

    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  it('has cancel button', () => {
    render(<UniversityFormDialog {...defaultProps} />)

    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('shows URL input fields in the links tab', () => {
    render(<UniversityFormDialog {...defaultProps} />)

    expect(screen.getByPlaceholderText('https://university.uz')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('https://student.university.uz')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('https://teacher.university.uz')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('https://uzbmb.university.uz')).toBeInTheDocument()
  })

  it('shows settings checkboxes', () => {
    render(<UniversityFormDialog {...defaultProps} />)

    expect(screen.getByTestId('checkbox-active')).toBeInTheDocument()
    expect(screen.getByTestId('checkbox-gpaEdit')).toBeInTheDocument()
    expect(screen.getByTestId('checkbox-accreditationEdit')).toBeInTheDocument()
    expect(screen.getByTestId('checkbox-addStudent')).toBeInTheDocument()
    expect(screen.getByTestId('checkbox-allowGrouping')).toBeInTheDocument()
    expect(screen.getByTestId('checkbox-allowTransferOutside')).toBeInTheDocument()
  })

  it('shows additional tab content (bank info, accreditation)', () => {
    render(<UniversityFormDialog {...defaultProps} />)

    expect(screen.getByPlaceholderText('Bank details')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Accreditation details')).toBeInTheDocument()
  })

  it('disables code field when editing', () => {
    const university = {
      code: 'U001',
      name: 'Test University',
      active: true,
    }

    render(
      <UniversityFormDialog
        {...defaultProps}
        university={university as Parameters<typeof UniversityFormDialog>[0]['university']}
      />,
    )

    const codeInput = screen.getByPlaceholderText('00001')
    expect(codeInput).toBeDisabled()
  })
})
