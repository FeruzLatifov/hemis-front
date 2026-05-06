import { render, screen } from '@/test/test-utils'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'uz', changeLanguage: vi.fn(), on: vi.fn(), off: vi.fn() },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    // Pretend the URL has a valid token; the page reads ?token=xxx via useSearchParams.
    useSearchParams: () => [new URLSearchParams('token=test-token'), vi.fn()],
  }
})

vi.mock('@/api/password-reset.api', () => ({
  passwordResetApi: {
    resetPassword: vi.fn().mockResolvedValue(undefined),
    validateResetToken: vi.fn().mockResolvedValue({ valid: true }),
  },
}))

vi.mock('@/utils/error.util', () => ({
  extractApiErrorMessage: vi.fn((_err: unknown, fallback: string) => fallback),
}))

vi.mock('@/assets/images/hemis-logo-new.png', () => ({
  default: 'hemis-logo-mock.png',
}))

import ResetPasswordPage from '../ResetPasswordPage'

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the heading', () => {
    render(<ResetPasswordPage />)
    expect(screen.getByText('Reset password')).toBeInTheDocument()
  })

  it('renders the new-password input with id "new-password"', () => {
    render(<ResetPasswordPage />)
    const input = document.getElementById('new-password') as HTMLInputElement | null
    expect(input).not.toBeNull()
    expect(input?.type).toBe('password')
  })

  it('renders the confirm-password input with id "confirm-password"', () => {
    render(<ResetPasswordPage />)
    const input = document.getElementById('confirm-password') as HTMLInputElement | null
    expect(input).not.toBeNull()
    expect(input?.type).toBe('password')
  })

  it('renders the back-to-login affordance', () => {
    render(<ResetPasswordPage />)
    expect(screen.getByText('Back to login')).toBeInTheDocument()
  })
})
