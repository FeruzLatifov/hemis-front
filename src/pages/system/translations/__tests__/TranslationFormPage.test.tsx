import { render, screen, waitFor, fireEvent, act } from '@/test/test-utils'

const mockNavigate = vi.fn()

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

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'tr-001' }),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  }
})

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

// Mock error util
vi.mock('@/utils/error.util', () => ({
  extractApiErrorMessage: vi.fn((_err: unknown, fallback: string) => fallback),
}))

// Mock translations API
vi.mock('@/api/translations.api', () => ({
  getTranslationById: vi.fn().mockResolvedValue({
    id: 'tr-001',
    category: 'menu',
    messageKey: 'Dashboard',
    message: 'Bosh sahifa',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    translations: {
      'oz-UZ': 'Bosh sahifa (oz)',
      'ru-RU': 'Glavnaya stranitsa',
      'en-US': 'Dashboard',
    },
  }),
  updateTranslation: vi.fn().mockResolvedValue({}),
  searchByMessageText: vi.fn().mockResolvedValue([]),
  TranslationUpdateRequest: {},
  Translation: {},
}))

import TranslationFormPage from '../TranslationFormPage'
import { toast } from 'sonner'

describe('TranslationFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the edit page with title', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(screen.getByText('Edit translation')).toBeInTheDocument()
    })
  })

  it('renders subtitle', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(screen.getByText('Update existing translation')).toBeInTheDocument()
    })
  })

  it('shows category field (readonly)', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      const categoryInput = screen.getByPlaceholderText('menu, button, label, error...')
      expect(categoryInput).toBeInTheDocument()
      expect(categoryInput).toBeDisabled()
    })
  })

  it('shows message key field (readonly)', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      const keyInput = screen.getByPlaceholderText('Dashboard, Save, Students...')
      expect(keyInput).toBeInTheDocument()
      expect(keyInput).toBeDisabled()
    })
  })

  it('populates category from loaded data', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      const categoryInput = screen.getByPlaceholderText(
        'menu, button, label, error...',
      ) as HTMLInputElement
      expect(categoryInput.value).toBe('menu')
    })
  })

  it('populates message key from loaded data', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      const keyInput = screen.getByPlaceholderText(
        'Dashboard, Save, Students...',
      ) as HTMLInputElement
      expect(keyInput.value).toBe('Dashboard')
    })
  })

  it('shows Uzbek (Latin) textarea', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Primary text (uz-UZ)')).toBeInTheDocument()
    })
  })

  it('populates Uzbek translation from loaded data', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      const uzTextarea = screen.getByPlaceholderText('Primary text (uz-UZ)') as HTMLTextAreaElement
      expect(uzTextarea.value).toBe('Bosh sahifa')
    })
  })

  it('shows Uzbek (Cyrillic) textarea', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Cyrillic text (oz-UZ)')).toBeInTheDocument()
    })
  })

  it('shows Russian textarea', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Russian translation (ru-RU)')).toBeInTheDocument()
    })
  })

  it('shows English textarea', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('English translation (en-US)')).toBeInTheDocument()
    })
  })

  it('populates other language translations from loaded data', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      const ozTextarea = screen.getByPlaceholderText('Cyrillic text (oz-UZ)') as HTMLTextAreaElement
      expect(ozTextarea.value).toBe('Bosh sahifa (oz)')

      const ruTextarea = screen.getByPlaceholderText(
        'Russian translation (ru-RU)',
      ) as HTMLTextAreaElement
      expect(ruTextarea.value).toBe('Glavnaya stranitsa')

      const enTextarea = screen.getByPlaceholderText(
        'English translation (en-US)',
      ) as HTMLTextAreaElement
      expect(enTextarea.value).toBe('Dashboard')
    })
  })

  it('shows active checkbox', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(screen.getByText('Active (ready for use)')).toBeInTheDocument()
    })
  })

  it('has submit (Update) button', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(screen.getByText('Update')).toBeInTheDocument()
    })
  })

  it('has cancel button', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
  })

  it('shows translations section header', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(screen.getByText('Translations section')).toBeInTheDocument()
    })
  })

  it('shows help section', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(screen.getByText('Help section')).toBeInTheDocument()
    })
  })

  it('shows key cannot be changed warning', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(screen.getByText(/Key cannot be changed/)).toBeInTheDocument()
    })
  })

  it('shows loading state initially', async () => {
    const api = await import('@/api/translations.api')
    vi.mocked(api.getTranslationById).mockReturnValueOnce(new Promise(() => {}))

    render(<TranslationFormPage />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows inactive state description', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(
        screen.getByText('If inactive, frontend will not see this translation'),
      ).toBeInTheDocument()
    })
  })

  // ====== NEW TESTS: Error on load ======

  it('shows error when translation fails to load', async () => {
    const api = await import('@/api/translations.api')
    vi.mocked(api.getTranslationById).mockRejectedValueOnce(new Error('Not found'))

    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(screen.getByText(/Error/)).toBeInTheDocument()
      expect(screen.getByText(/Failed to load translation/)).toBeInTheDocument()
    })
  })

  // ====== NEW TESTS: Form field changes ======

  it('allows editing the Uzbek textarea', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Primary text (uz-UZ)')).toBeInTheDocument()
    })

    const uzTextarea = screen.getByPlaceholderText('Primary text (uz-UZ)')
    fireEvent.change(uzTextarea, { target: { value: 'Yangi matn' } })
    expect((uzTextarea as HTMLTextAreaElement).value).toBe('Yangi matn')
  })

  it('allows editing the Russian textarea', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Russian translation (ru-RU)')).toBeInTheDocument()
    })

    const ruTextarea = screen.getByPlaceholderText('Russian translation (ru-RU)')
    fireEvent.change(ruTextarea, { target: { value: 'Novyi tekst' } })
    expect((ruTextarea as HTMLTextAreaElement).value).toBe('Novyi tekst')
  })

  it('allows editing the English textarea', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('English translation (en-US)')).toBeInTheDocument()
    })

    const enTextarea = screen.getByPlaceholderText('English translation (en-US)')
    fireEvent.change(enTextarea, { target: { value: 'New text' } })
    expect((enTextarea as HTMLTextAreaElement).value).toBe('New text')
  })

  it('allows editing the Cyrillic textarea', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Cyrillic text (oz-UZ)')).toBeInTheDocument()
    })

    const ozTextarea = screen.getByPlaceholderText('Cyrillic text (oz-UZ)')
    fireEvent.change(ozTextarea, { target: { value: 'Yangi matn' } })
    expect((ozTextarea as HTMLTextAreaElement).value).toBe('Yangi matn')
  })

  it('allows toggling the active checkbox', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox.checked).toBe(true)

    fireEvent.click(checkbox)
    expect(checkbox.checked).toBe(false)

    fireEvent.click(checkbox)
    expect(checkbox.checked).toBe(true)
  })

  // ====== NEW TESTS: Cancel button ======

  it('navigates back to translations list when Cancel is clicked', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Cancel'))

    expect(mockNavigate).toHaveBeenCalledWith('/system/translations')
  })

  // ====== NEW TESTS: Form submission - success ======

  it('submits the form successfully and shows success toast', async () => {
    const api = await import('@/api/translations.api')

    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(screen.getByText('Update')).toBeInTheDocument()
      // Ensure data is loaded
      expect(
        (screen.getByPlaceholderText('Primary text (uz-UZ)') as HTMLTextAreaElement).value,
      ).toBe('Bosh sahifa')
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Update'))
    })

    await waitFor(() => {
      expect(api.updateTranslation).toHaveBeenCalledWith(
        'tr-001',
        expect.objectContaining({
          category: 'menu',
          messageKey: 'Dashboard',
          messageUz: 'Bosh sahifa',
        }),
      )
      expect(toast.success).toHaveBeenCalledWith(
        'Translation successfully updated',
        expect.any(Object),
      )
    })
  })

  it('navigates to translations list after successful submit', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(screen.getByText('Update')).toBeInTheDocument()
      expect(
        (screen.getByPlaceholderText('Primary text (uz-UZ)') as HTMLTextAreaElement).value,
      ).toBe('Bosh sahifa')
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Update'))
    })

    // The redirect happens after a 500ms setTimeout
    await act(async () => {
      vi.advanceTimersByTime(600)
    })

    expect(mockNavigate).toHaveBeenCalledWith('/system/translations')
  })

  // ====== NEW TESTS: Form submission - error ======

  it('shows error when form submission fails', async () => {
    const api = await import('@/api/translations.api')
    vi.mocked(api.updateTranslation).mockRejectedValueOnce(new Error('Update failed'))

    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(screen.getByText('Update')).toBeInTheDocument()
      expect(
        (screen.getByPlaceholderText('Primary text (uz-UZ)') as HTMLTextAreaElement).value,
      ).toBe('Bosh sahifa')
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Update'))
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error saving translation', expect.any(Object))
      expect(screen.getByText(/Error saving translation/)).toBeInTheDocument()
    })
  })

  // ====== NEW TESTS: Validation errors ======

  it('shows validation error when Uzbek text is empty', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(
        (screen.getByPlaceholderText('Primary text (uz-UZ)') as HTMLTextAreaElement).value,
      ).toBe('Bosh sahifa')
    })

    // Clear the Uzbek field
    const uzTextarea = screen.getByPlaceholderText('Primary text (uz-UZ)')
    fireEvent.change(uzTextarea, { target: { value: '' } })

    await act(async () => {
      fireEvent.click(screen.getByText('Update'))
    })

    await waitFor(() => {
      expect(screen.getByText('Uzbek (Latin) is required')).toBeInTheDocument()
    })
  })

  it('clears field error when user types in the errored field', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(
        (screen.getByPlaceholderText('Primary text (uz-UZ)') as HTMLTextAreaElement).value,
      ).toBe('Bosh sahifa')
    })

    // Clear the Uzbek field to trigger validation error
    const uzTextarea = screen.getByPlaceholderText('Primary text (uz-UZ)')
    fireEvent.change(uzTextarea, { target: { value: '' } })

    await act(async () => {
      fireEvent.click(screen.getByText('Update'))
    })

    await waitFor(() => {
      expect(screen.getByText('Uzbek (Latin) is required')).toBeInTheDocument()
    })

    // Now type in the field - error should clear
    fireEvent.change(uzTextarea, { target: { value: 'Fixed text' } })

    await waitFor(() => {
      expect(screen.queryByText('Uzbek (Latin) is required')).not.toBeInTheDocument()
    })
  })

  // ====== NEW TESTS: Similar translations ======

  it('shows similar translations warning when similar text is found', async () => {
    vi.useRealTimers()
    const api = await import('@/api/translations.api')
    vi.mocked(api.searchByMessageText).mockResolvedValue([
      {
        id: 'tr-099',
        category: 'label',
        messageKey: 'HomepageTitle',
        message: 'Bosh sahifa qismi',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ])

    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(
        (screen.getByPlaceholderText('Primary text (uz-UZ)') as HTMLTextAreaElement).value,
      ).toBe('Bosh sahifa')
    })

    const uzTextarea = screen.getByPlaceholderText('Primary text (uz-UZ)')
    fireEvent.change(uzTextarea, { target: { value: 'Bosh sahifa qis' } })

    await waitFor(
      () => {
        expect(screen.getByText(/Similar translations found/)).toBeInTheDocument()
        expect(screen.getByText('HomepageTitle')).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  it('does not search for similar translations when text is too short', async () => {
    vi.useRealTimers()
    const api = await import('@/api/translations.api')

    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(
        (screen.getByPlaceholderText('Primary text (uz-UZ)') as HTMLTextAreaElement).value,
      ).toBe('Bosh sahifa')
    })

    const uzTextarea = screen.getByPlaceholderText('Primary text (uz-UZ)')
    fireEvent.change(uzTextarea, { target: { value: 'ab' } })

    // Wait a bit to make sure the debounce would have fired
    await new Promise((r) => setTimeout(r, 800))

    // searchByMessageText should not be called for short text
    expect(api.searchByMessageText).not.toHaveBeenCalled()
  })

  it('clears similar translations when text is emptied', async () => {
    vi.useRealTimers()
    const api = await import('@/api/translations.api')
    vi.mocked(api.searchByMessageText).mockResolvedValue([
      {
        id: 'tr-099',
        category: 'label',
        messageKey: 'HomepageTitle',
        message: 'Bosh sahifa qismi',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ])

    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(
        (screen.getByPlaceholderText('Primary text (uz-UZ)') as HTMLTextAreaElement).value,
      ).toBe('Bosh sahifa')
    })

    const uzTextarea = screen.getByPlaceholderText('Primary text (uz-UZ)')

    // Type text to trigger similar search
    fireEvent.change(uzTextarea, { target: { value: 'Bosh sahifa qis' } })

    await waitFor(
      () => {
        expect(screen.getByText(/Similar translations found/)).toBeInTheDocument()
      },
      { timeout: 3000 },
    )

    // Clear the text
    fireEvent.change(uzTextarea, { target: { value: '' } })

    await waitFor(() => {
      expect(screen.queryByText(/Similar translations found/)).not.toBeInTheDocument()
    })
  })

  it('shows "and more" text when more than 5 similar translations', async () => {
    vi.useRealTimers()
    const api = await import('@/api/translations.api')
    const manyResults = Array.from({ length: 7 }, (_, i) => ({
      id: `tr-sim-${i}`,
      category: 'label',
      messageKey: `Key${i}`,
      message: `Similar text ${i}`,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }))
    vi.mocked(api.searchByMessageText).mockResolvedValue(manyResults)

    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(
        (screen.getByPlaceholderText('Primary text (uz-UZ)') as HTMLTextAreaElement).value,
      ).toBe('Bosh sahifa')
    })

    const uzTextarea = screen.getByPlaceholderText('Primary text (uz-UZ)')
    fireEvent.change(uzTextarea, { target: { value: 'Similar text' } })

    await waitFor(
      () => {
        expect(screen.getByText(/Similar translations found/)).toBeInTheDocument()
        // Should show "...and more 2" (7 total - 5 shown = 2 more)
        expect(screen.getByText(/and more/)).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  // ====== NEW TESTS: Translation with no translations object ======

  it('handles translation data without translations object', async () => {
    const api = await import('@/api/translations.api')
    vi.mocked(api.getTranslationById).mockResolvedValueOnce({
      id: 'tr-001',
      category: 'menu',
      messageKey: 'Dashboard',
      message: 'Bosh sahifa',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      translations: undefined,
    })

    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(
        (screen.getByPlaceholderText('Primary text (uz-UZ)') as HTMLTextAreaElement).value,
      ).toBe('Bosh sahifa')
      // Other languages should be empty since no translations object
      expect(
        (screen.getByPlaceholderText('Cyrillic text (oz-UZ)') as HTMLTextAreaElement).value,
      ).toBe('')
      expect(
        (screen.getByPlaceholderText('Russian translation (ru-RU)') as HTMLTextAreaElement).value,
      ).toBe('')
      expect(
        (screen.getByPlaceholderText('English translation (en-US)') as HTMLTextAreaElement).value,
      ).toBe('')
    })
  })

  // ====== NEW TESTS: Button shows Saving text during submit ======

  it('shows Saving text on submit button while submitting', async () => {
    const api = await import('@/api/translations.api')
    // Make updateTranslation hang for a while
    let resolveUpdate: () => void
    vi.mocked(api.updateTranslation).mockReturnValueOnce(
      new Promise<Record<string, never>>((resolve) => {
        resolveUpdate = () => resolve({})
      }),
    )

    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(
        (screen.getByPlaceholderText('Primary text (uz-UZ)') as HTMLTextAreaElement).value,
      ).toBe('Bosh sahifa')
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Update'))
    })

    // During submission, button text should change to "Saving..."
    expect(screen.getByText('Saving...')).toBeInTheDocument()

    // Resolve the update to clean up
    await act(async () => {
      resolveUpdate!()
    })
  })

  // ====== NEW TESTS: Help section items ======

  it('shows all help section items', async () => {
    render(<TranslationFormPage />)

    await waitFor(() => {
      expect(screen.getByText('Help section')).toBeInTheDocument()
      expect(screen.getByText(/For grouping translations/)).toBeInTheDocument()
      expect(screen.getByText(/Used in code, cannot be changed/)).toBeInTheDocument()
      expect(screen.getByText(/Primary language, required/)).toBeInTheDocument()
      expect(screen.getByText(/Optional, but recommended/)).toBeInTheDocument()
      expect(screen.getByText(/If active, frontend will show the translation/)).toBeInTheDocument()
    })
  })
})
