import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'

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

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
  Toaster: () => null,
}))

// Mock auth store
const mockLogin = vi.fn()
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector?: (state: Record<string, unknown>) => unknown) => {
    const state = {
      login: mockLogin,
      logout: vi.fn(),
      user: null,
      isAuthenticated: false,
      permissions: [],
    }
    return selector ? selector(state) : state
  }),
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  }
})

// Mock logo image
vi.mock('@/assets/images/hemis-logo-new.png', () => ({
  default: 'hemis-logo-mock.png',
}))

// Mock error utility
vi.mock('@/utils/error.util', () => ({
  extractApiErrorMessage: vi.fn((_err: unknown, fallback: string) => fallback),
  getErrorStatus: vi.fn(() => 0),
  isNetworkError: vi.fn(() => false),
}))

import Login from '../LoginPage'

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<Login />)
    expect(screen.getByText('HEMIS')).toBeInTheDocument()
  })

  it('renders the login form heading', () => {
    render(<Login />)
    expect(screen.getByText('Sign in to system')).toBeInTheDocument()
    expect(screen.getByText('Enter your credentials to continue')).toBeInTheDocument()
  })

  it('renders username and password input fields', () => {
    render(<Login />)

    const usernameInput = screen.getByLabelText('Username')
    expect(usernameInput).toBeInTheDocument()
    expect(usernameInput).toHaveAttribute('type', 'text')

    const passwordInput = screen.getByLabelText('Password')
    expect(passwordInput).toBeInTheDocument()
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('renders the submit button with correct text', () => {
    render(<Login />)
    const submitButton = screen.getByRole('button', { name: 'Sign in' })
    expect(submitButton).toBeInTheDocument()
    expect(submitButton).toHaveAttribute('type', 'submit')
  })

  it('renders HEMIS logo image', () => {
    render(<Login />)
    const logo = screen.getByAltText('HEMIS')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', 'hemis-logo-mock.png')
  })

  it('renders the Higher Education description text', () => {
    render(<Login />)
    expect(screen.getByText('Higher Education Management Information System')).toBeInTheDocument()
  })

  it('renders copyright text with current year', () => {
    render(<Login />)
    const currentYear = new Date().getFullYear()
    expect(screen.getByText(new RegExp(`${currentYear}`))).toBeInTheDocument()
    expect(screen.getByText(/HEMIS. All rights reserved./)).toBeInTheDocument()
  })

  it('renders language selector button', () => {
    render(<Login />)
    expect(screen.getByText("O'zbekcha")).toBeInTheDocument()
  })

  it('renders ministry description text', () => {
    render(<Login />)
    expect(
      screen.getByText('Ministry of Higher Education, Science and Innovations'),
    ).toBeInTheDocument()
  })

  it('renders statistics section with institution count', () => {
    render(<Login />)
    expect(screen.getByText('226+ higher education institutions')).toBeInTheDocument()
  })

  it('renders statistics section with user count', () => {
    render(<Login />)
    expect(screen.getByText('1,000,000+ users')).toBeInTheDocument()
  })

  it('renders statistics section with module count', () => {
    render(<Login />)
    expect(screen.getByText('4 management modules')).toBeInTheDocument()
  })

  it('has username input with correct autocomplete attribute', () => {
    render(<Login />)
    const usernameInput = screen.getByLabelText('Username')
    expect(usernameInput).toHaveAttribute('autocomplete', 'username')
  })

  it('has password input with correct autocomplete attribute', () => {
    render(<Login />)
    const passwordInput = screen.getByLabelText('Password')
    expect(passwordInput).toHaveAttribute('autocomplete', 'current-password')
  })

  it('renders username placeholder text', () => {
    render(<Login />)
    expect(screen.getByPlaceholderText('Login')).toBeInTheDocument()
  })

  it('renders password placeholder text', () => {
    render(<Login />)
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
  })

  it('calls login on valid form submission', async () => {
    mockLogin.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()

    render(<Login />)

    const usernameInput = screen.getByLabelText('Username')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign in' })

    await user.type(usernameInput, 'adminuser')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: 'adminuser',
        password: 'password123',
        locale: 'uz',
      })
    })
  })

  it('navigates to dashboard on successful login', async () => {
    mockLogin.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()

    render(<Login />)

    const usernameInput = screen.getByLabelText('Username')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign in' })

    await user.type(usernameInput, 'adminuser')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
    })
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    render(<Login />)

    const passwordInput = screen.getByLabelText('Password')
    expect(passwordInput).toHaveAttribute('type', 'password')

    const toggleButton = screen.getByLabelText('Show password')
    await user.click(toggleButton)

    expect(passwordInput).toHaveAttribute('type', 'text')

    const hideButton = screen.getByLabelText('Hide password')
    await user.click(hideButton)

    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('shows toast error when login fails', async () => {
    const { toast } = await import('sonner')
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'))

    const { isNetworkError, getErrorStatus } = await import('@/utils/error.util')
    vi.mocked(isNetworkError).mockReturnValueOnce(false)
    vi.mocked(getErrorStatus).mockReturnValueOnce(401)

    const user = userEvent.setup()
    render(<Login />)

    const usernameInput = screen.getByLabelText('Username')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign in' })

    await user.type(usernameInput, 'wronguser')
    await user.type(passwordInput, 'wrongpass')
    await user.click(submitButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })
  })

  it('disables inputs while loading', async () => {
    // Make login hang (never resolve)
    mockLogin.mockReturnValueOnce(new Promise(() => {}))
    const user = userEvent.setup()

    render(<Login />)

    const usernameInput = screen.getByLabelText('Username')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign in' })

    await user.type(usernameInput, 'adminuser')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })
})
