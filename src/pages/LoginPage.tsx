import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import hemisLogo from '@/assets/images/hemis-logo-new.png'
import { User, Eye, EyeOff, Globe, ChevronDown, Building2, Users, BookOpen } from 'lucide-react'
import { extractApiErrorMessage, getErrorStatus, isNetworkError } from '@/utils/error.util'

type SupportedLang = 'uz' | 'oz' | 'ru' | 'en'

const DEFAULT_LANGUAGE: SupportedLang = 'uz'

const SUPPORTED_LANGUAGES: Array<{ code: SupportedLang; name: string }> = [
  { code: 'uz', name: "O'zbekcha" },
  { code: 'oz', name: 'Ўзбекча' },
  { code: 'ru', name: 'Русский' },
  { code: 'en', name: 'English' },
]

const resolveLanguage = (lang?: string | null): SupportedLang => {
  if (!lang) return DEFAULT_LANGUAGE
  return SUPPORTED_LANGUAGES.some(({ code }) => code === lang)
    ? (lang as SupportedLang)
    : DEFAULT_LANGUAGE
}

const Login = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuthStore()

  // Get redirect path from state (set by ProtectedRoute)
  // Validate redirect URL to prevent open redirect attacks
  const rawFrom = (location.state as { from?: string })?.from || '/dashboard'
  const from = rawFrom.startsWith('/') && !rawFrom.startsWith('//') ? rawFrom : '/dashboard'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentLang, setCurrentLang] = useState<SupportedLang>(() =>
    resolveLanguage(
      (typeof window !== 'undefined' ? localStorage.getItem('locale') : null) || i18n.language,
    ),
  )
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false)
  const langDropdownRef = useRef<HTMLDivElement>(null)
  const [usernameError, setUsernameError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Close language dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    i18n.changeLanguage(currentLang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', currentLang)
    }
    setUsernameError('')
    setPasswordError('')
  }, [currentLang, i18n])

  const handleLanguageChange = useCallback(
    (lang: SupportedLang) => {
      if (lang === currentLang) {
        setIsLangDropdownOpen(false)
        return
      }
      setCurrentLang(lang)
      setIsLangDropdownOpen(false)
    },
    [currentLang],
  )

  const validateField = useCallback(
    (value: string, minLength: number, label: string) => {
      const trimmed = value.trim()
      if (!trimmed) return t('{{field}} is required', { field: label })
      if (trimmed.length < minLength)
        return t('Must be at least {{count}} characters', { count: minLength })
      return ''
    },
    [t],
  )

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      const uErr = validateField(username, 3, t('Username'))
      const pErr = validateField(password, 6, t('Password'))
      setUsernameError(uErr)
      setPasswordError(pErr)
      if (uErr || pErr) return

      setIsLoading(true)
      try {
        await login({
          username: username.trim(),
          password,
          locale: currentLang,
        })
        toast.success(t('Welcome back!'), { duration: 2000, position: 'bottom-right' })
        // Redirect to the original page or dashboard
        navigate(from, { replace: true })
      } catch (err: unknown) {
        const status = getErrorStatus(err, 0)
        if (isNetworkError(err) || status === 0) {
          toast.error(t('Backend server is not available'), {
            duration: 8000,
            position: 'bottom-right',
          })
          return
        }
        toast.error(extractApiErrorMessage(err, t('Something went wrong')), {
          duration: status === 429 ? 8000 : 5000,
          position: 'bottom-right',
        })
      } finally {
        setIsLoading(false)
      }
    },
    [username, password, currentLang, validateField, login, navigate, t, from],
  )

  return (
    <div className="flex min-h-screen flex-col overflow-hidden lg:flex-row">
      {/* ═══════ CHAP PANEL ═══════ */}
      <div className="relative flex shrink-0 flex-col items-center justify-center overflow-hidden bg-[var(--login-bg)] px-8 py-14 lg:w-[52%] lg:py-0">
        {/* ——— Animated Blobs (sizes/positions in index.css) ——— */}
        <div className="login-blob login-blob-1" />
        <div className="login-blob login-blob-2" />
        <div className="login-blob login-blob-3" />
        <div className="login-blob login-blob-4" />

        {/* Kontent */}
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Logotip — oq doira, rasmiy muhr */}
          <div className="login-stagger mb-10 [animation-delay:0s]">
            <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-white p-5 shadow-lg lg:h-40 lg:w-40">
              <img src={hemisLogo} alt="HEMIS" className="h-full w-full object-contain" />
            </div>
          </div>

          {/* Sarlavha */}
          <h1 className="login-stagger font-display mb-4 text-2xl font-bold tracking-[0.06em] text-white [animation-delay:0.1s] lg:text-3xl">
            HEMIS
          </h1>

          {/* Tavsif */}
          <p className="login-stagger mb-12 max-w-[280px] text-sm leading-relaxed text-white/55 [animation-delay:0.2s] lg:text-[15px]">
            {t('Higher Education Management Information System')}
          </p>

          {/* Statistika — faqat desktop */}
          <div className="mb-12 hidden flex-col gap-4 lg:flex">
            <div className="login-stagger flex items-center gap-3 [animation-delay:0.3s]">
              <Building2 className="h-[18px] w-[18px] shrink-0 text-[var(--login-accent)]" />
              <span className="text-sm text-white/70">
                {t('226+ higher education institutions')}
              </span>
            </div>
            <div className="login-stagger flex items-center gap-3 [animation-delay:0.4s]">
              <Users className="h-[18px] w-[18px] shrink-0 text-[var(--login-accent)]" />
              <span className="text-sm text-white/70">{t('1,000,000+ users')}</span>
            </div>
            <div className="login-stagger flex items-center gap-3 [animation-delay:0.5s]">
              <BookOpen className="h-[18px] w-[18px] shrink-0 text-[var(--login-accent)]" />
              <span className="text-sm text-white/70">{t('4 management modules')}</span>
            </div>
          </div>

          {/* Vazirliq nomi */}
          <p className="login-stagger hidden max-w-[260px] text-xs leading-relaxed text-white/30 [animation-delay:0.6s] lg:block">
            {t('Ministry of Higher Education, Science and Innovations')}
          </p>
        </div>
      </div>

      {/* ═══════ O'NG PANEL ═══════ */}
      <div className="relative flex flex-1 flex-col items-center justify-center bg-[var(--app-bg)] px-6 py-12 lg:py-0">
        {/* Til tanlash */}
        <div className="absolute top-5 right-5 z-20">
          <div className="relative" ref={langDropdownRef}>
            <button
              type="button"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-2 rounded-lg border border-[var(--border-color-pro)] bg-[var(--card-bg)] px-3 py-2 shadow-[var(--shadow-sm)] transition-all"
              disabled={isLoading}
            >
              <Globe className="h-4 w-4 text-[var(--text-secondary)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {SUPPORTED_LANGUAGES.find((l) => l.code === currentLang)?.name}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-[var(--text-secondary)] transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isLangDropdownOpen && (
              <div className="absolute top-full right-0 mt-1.5 w-44 overflow-hidden rounded-lg border border-[var(--border-color-pro)] bg-[var(--card-bg)] shadow-[0_4px_16px_rgba(15,23,42,0.12)]">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isActive = currentLang === lang.code
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`flex w-full items-center px-4 py-2.5 transition-colors ${
                        isActive
                          ? 'bg-[var(--login-active)] text-white'
                          : 'bg-[var(--card-bg)] text-[var(--text-primary)] hover:bg-[var(--active-bg)]'
                      }`}
                      disabled={isLoading}
                    >
                      <span className="text-sm font-medium">{lang.name}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Login form */}
        <div className="animate-slide-up w-full max-w-[400px]">
          <div className="login-form-card">
            <div className="mb-8">
              <h2 className="font-display mb-1.5 text-xl font-semibold text-[var(--text-primary)]">
                {t('Sign in to system')}
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {t('Enter your credentials to continue')}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="login-username"
                  className="mb-2 block text-[13px] font-medium text-[var(--text-primary)]"
                >
                  {t('Username')}
                </label>
                <div className="relative">
                  <input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value)
                      if (usernameError)
                        setUsernameError(validateField(e.target.value, 3, t('Username')))
                    }}
                    onBlur={(e) =>
                      setUsernameError(validateField(e.target.value, 3, t('Username')))
                    }
                    aria-invalid={!!usernameError}
                    aria-describedby={usernameError ? 'login-username-error' : undefined}
                    placeholder={t('Login')}
                    className="login-input pr-10"
                    autoComplete="username"
                    required
                    disabled={isLoading}
                  />
                  <User className="absolute top-1/2 right-3 h-[18px] w-[18px] -translate-y-1/2 text-[var(--text-secondary)] opacity-40" />
                </div>
                {usernameError && (
                  <p id="login-username-error" role="alert" className="mt-1.5 text-xs text-red-500">
                    {usernameError}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="mb-2 block text-[13px] font-medium text-[var(--text-primary)]"
                >
                  {t('Password')}
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (passwordError)
                        setPasswordError(validateField(e.target.value, 6, t('Password')))
                    }}
                    onBlur={(e) =>
                      setPasswordError(validateField(e.target.value, 6, t('Password')))
                    }
                    aria-invalid={!!passwordError}
                    aria-describedby={passwordError ? 'login-password-error' : undefined}
                    placeholder={t('Password')}
                    className="login-input pr-10"
                    autoComplete="current-password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-[var(--text-secondary)] opacity-40 transition-colors"
                    disabled={isLoading}
                    aria-label={showPassword ? t('Hide password') : t('Show password')}
                  >
                    {showPassword ? (
                      <EyeOff className="h-[18px] w-[18px]" />
                    ) : (
                      <Eye className="h-[18px] w-[18px]" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p id="login-password-error" role="alert" className="mt-1.5 text-xs text-red-500">
                    {passwordError}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
                  {t('Forgot password?')}
                </Link>
              </div>

              <div className="pt-1">
                <button type="submit" disabled={isLoading} className="login-submit-btn">
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>{t('Loading...')}</span>
                    </>
                  ) : (
                    <span>{t('Sign in')}</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-[var(--text-secondary)] opacity-60">
            &copy; {new Date().getFullYear()} {t('HEMIS. All rights reserved.')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
