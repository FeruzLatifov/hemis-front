import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuthStore } from '../stores/authStore'
import hemisLogo from '../assets/images/hemis-logo-new.png'
import {
  User,
  Eye,
  EyeOff,
  Globe,
  ChevronDown,
} from 'lucide-react'
import { extractApiErrorMessage, getErrorStatus, isNetworkError } from '@/utils/error.util'

type SupportedLang = 'uz' | 'oz' | 'ru' | 'en'

const DEFAULT_LANGUAGE: SupportedLang = 'uz'

const SUPPORTED_LANGUAGES: Array<{ code: SupportedLang; name: string }> = [
  { code: 'uz', name: "O'zbekcha" },
  { code: 'oz', name: 'Ўзбекча' },
  { code: 'ru', name: 'Русский' },
  { code: 'en', name: 'English' },
]

const INPUT_STYLE: CSSProperties = {
  borderColor: 'var(--border-color-pro)',
  backgroundColor: 'var(--card-bg)',
  color: 'var(--text-primary)',
}

const resolveLanguage = (lang?: string | null): SupportedLang => {
  if (!lang) {
    return DEFAULT_LANGUAGE
  }

  return SUPPORTED_LANGUAGES.some(({ code }) => code === lang)
    ? (lang as SupportedLang)
    : DEFAULT_LANGUAGE
}

const Login = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentLang, setCurrentLang] = useState<SupportedLang>(() =>
    resolveLanguage(
      (typeof window !== 'undefined' ? localStorage.getItem('locale') : null) ||
      i18n.language
    )
  )
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    i18n.changeLanguage(currentLang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', currentLang)
    }
    setUsernameError('')
    setPasswordError('')
  }, [currentLang, i18n])

  const handleLanguageChange = (lang: SupportedLang) => {
    if (lang === currentLang) {
      setIsLangDropdownOpen(false)
      return
    }

    setCurrentLang(lang)
    setIsLangDropdownOpen(false)
  }

  const validateField = (
    value: string,
    minLength: number,
    label: string
  ) => {
    const trimmedValue = value.trim()

    if (!trimmedValue) {
      return (
        t('login.errors.requiredField', { field: label }) ||
        t('login.errors.required') ||
        'This field is required'
      )
    }

    if (trimmedValue.length < minLength) {
      return (
        t('login.errors.minLength', { count: minLength }) ||
        `Must be at least ${minLength} characters`
      )
    }

    return ''
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    const usernameValidation = validateField(
      username,
      3,
      t('login.username') || 'Username'
    )
    const passwordValidation = validateField(
      password,
      6,
      t('login.password') || 'Password'
    )

    setUsernameError(usernameValidation)
    setPasswordError(passwordValidation)

    if (usernameValidation || passwordValidation) {
      return
    }

    setIsLoading(true)

    try {
      const trimmedUsername = username.trim()
      const trimmedPassword = password.trim()

      await login({
        username: trimmedUsername,
        password: trimmedPassword,
        locale: currentLang,
      })

      toast.success(t('login.success') || 'Tizimga muvaffaqiyatli kirdingiz', {
        duration: 2000,
        position: 'bottom-right',
      })

      navigate('/dashboard', { replace: true })
      return
    } catch (err: unknown) {
      console.error('[LoginClean] Login error:', err)

      const status = getErrorStatus(err, 0)

      // Rate limit (429) - juda ko'p urinish
      if (status === 429) {
        const errorData = (err as { response?: { data?: { errorDescription?: string } } })?.response?.data
        const msg = errorData?.errorDescription || t('login.errors.tooManyAttempts') || 'Juda ko\'p urinish. Keyinroq qayta urinib ko\'ring.'
        console.log('[LoginClean] Rate limit exceeded (429)')
        toast.error(msg, {
          duration: 8000,
          position: 'bottom-right',
        })
        return
      }

      const backendUnavailable = isNetworkError(err) || status === 0 || status >= 500

      if (backendUnavailable) {
        console.log('[LoginClean] Backend unavailable or network error detected')
        toast.error(t('login.errors.backendDown') || 'Backend server ishlamayapti. Iltimos, serverni ishga tushiring.', {
          duration: 8000,
          position: 'bottom-right',
        })
        return
      }

      const errorMessage =
        status === 401
          ? t('login.errors.invalidCredentials') || 'Login yoki parol noto\'g\'ri'
          : extractApiErrorMessage(
              err,
              t('login.errors.invalidCredentials')
            )

      console.log('[LoginClean] Backend error (status):', status, errorMessage)
      toast.error(errorMessage, {
        duration: 5000,
        position: 'bottom-right',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--app-bg)' }}>
      {/* Top Right Language Selector */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderWidth: '1px',
              borderColor: 'var(--border-color-pro)',
              boxShadow: 'var(--shadow-sm)'
            }}
            disabled={isLoading}
          >
            <Globe className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {SUPPORTED_LANGUAGES.find(l => l.code === currentLang)?.name}
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`}
              style={{ color: 'var(--text-secondary)' }}
            />
          </button>

          {isLangDropdownOpen && (
            <div
              className="absolute top-full right-0 mt-2 w-48 rounded-lg overflow-hidden"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderWidth: '1px',
                borderColor: 'var(--border-color-pro)',
                boxShadow: '0 4px 6px rgba(15, 23, 42, 0.1)'
              }}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageChange(lang.code)}
                  className="w-full flex items-center gap-3 px-4 py-3 transition-colors"
                  style={{
                    backgroundColor: currentLang === lang.code ? 'var(--primary)' : 'var(--card-bg)',
                    color: currentLang === lang.code ? 'white' : 'var(--text-primary)'
                  }}
                  onMouseEnter={(e) => {
                    if (currentLang !== lang.code) {
                      e.currentTarget.style.backgroundColor = 'var(--active-bg)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentLang !== lang.code) {
                      e.currentTarget.style.backgroundColor = 'var(--card-bg)'
                    }
                  }}
                  disabled={isLoading}
                >
                  <span className="text-sm font-medium">{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="container mx-auto px-4 w-full">
        <div className="max-w-md mx-auto w-full">
          <div className="w-full">
            <div className="card-professional p-8">
              {/* Logo and Title */}
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center border p-2"
                    style={{
                      borderColor: 'var(--primary)',
                      backgroundColor: 'white'
                    }}
                  >
                    <img src={hemisLogo} alt="HEMIS" className="w-full h-full object-contain" />
                  </div>
                </div>

                <h1 className="heading-page mb-2">HEMIS</h1>
                <p className="text-caption">{t('login.subtitle')}</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Username Input */}
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value)
                        if (usernameError) {
                          setUsernameError(
                            validateField(
                              e.target.value,
                              3,
                              t('login.username') || 'Username'
                            )
                          )
                        }
                      }}
                      onBlur={(e) =>
                        setUsernameError(
                          validateField(
                            e.target.value,
                            3,
                            t('login.username') || 'Username'
                          )
                        )
                      }
                      aria-invalid={!!usernameError}
                      placeholder={t('login.usernamePlaceholder')}
                      className="w-full border rounded-md px-3 py-2 pr-10 text-sm transition-colors focus:outline-none focus:ring-1"
                      style={{
                        ...INPUT_STYLE,
                        '--tw-ring-color': 'var(--primary)'
                      } as CSSProperties}
                      required
                      disabled={isLoading}
                    />
                    <User
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4"
                      style={{ color: 'var(--text-secondary)' }}
                    />
                  </div>
                  {usernameError && (
                    <p className="mt-1 text-xs text-red-500">{usernameError}</p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (passwordError) {
                          setPasswordError(
                            validateField(
                              e.target.value,
                              6,
                              t('login.password') || 'Password'
                            )
                          )
                        }
                      }}
                      onBlur={(e) =>
                        setPasswordError(
                          validateField(
                            e.target.value,
                            6,
                            t('login.password') || 'Password'
                          )
                        )
                      }
                      aria-invalid={!!passwordError}
                      placeholder={t('login.passwordPlaceholder')}
                      className="w-full border rounded-md px-3 py-2 pr-10 text-sm transition-colors focus:outline-none focus:ring-1"
                      style={{
                        ...INPUT_STYLE,
                        '--tw-ring-color': 'var(--primary)'
                      } as CSSProperties}
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      disabled={isLoading}
                      aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko\'rsatish'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="mt-1 text-xs text-red-500">{passwordError}</p>
                  )}
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{t('common.loading')}</span>
                    </>
                  ) : (
                    <span>{t('auth.login_button')}</span>
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-xs text-caption">
                  {t('login.copyright') || '© 2025 HEMIS. All rights reserved.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
