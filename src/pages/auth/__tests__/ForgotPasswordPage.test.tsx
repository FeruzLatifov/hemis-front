import { render, screen } from '@/test/test-utils'

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

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}))

vi.mock('@/api/password-reset.api', () => ({
  passwordResetApi: {
    forgotPassword: vi.fn().mockResolvedValue(undefined),
    resetPassword: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@/utils/error.util', () => ({
  extractApiErrorMessage: vi.fn((_err: unknown, fallback: string) => fallback),
}))

vi.mock('@/assets/images/hemis-logo-new.png', () => ({
  default: 'hemis-logo-mock.png',
}))

import ForgotPasswordPage from '../ForgotPasswordPage'

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the heading and subtitle', () => {
    render(<ForgotPasswordPage />)
    expect(screen.getByText('Forgot password?')).toBeInTheDocument()
    expect(
      screen.getByText('Enter your email and we will send you a reset link'),
    ).toBeInTheDocument()
  })

  it('renders the email input', () => {
    render(<ForgotPasswordPage />)
    const input = screen.getByPlaceholderText('user@example.com')
    expect(input).toBeInTheDocument()
    expect(input.tagName).toBe('INPUT')
    expect((input as HTMLInputElement).type).toBe('email')
  })

  it('renders the submit button labelled with the action key', () => {
    render(<ForgotPasswordPage />)
    expect(screen.getByText('Send reset link')).toBeInTheDocument()
  })

  it('renders the back-to-login link', () => {
    render(<ForgotPasswordPage />)
    expect(screen.getByText('Back to login')).toBeInTheDocument()
  })
})
