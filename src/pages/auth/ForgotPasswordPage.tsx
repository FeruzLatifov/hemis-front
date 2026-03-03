import { useState, useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ArrowLeft, Mail } from 'lucide-react'
import { passwordResetApi } from '@/api/password-reset.api'
import { extractApiErrorMessage } from '@/utils/error.util'
import hemisLogo from '@/assets/images/hemis-logo-new.png'

const COOLDOWN_SECONDS = 60

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current)
    }
  }, [])

  const startCooldown = useCallback(() => {
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    setCooldown(COOLDOWN_SECONDS)
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!email.trim() || cooldown > 0) return

      setIsLoading(true)
      try {
        await passwordResetApi.forgotPassword(email.trim())
        setIsSent(true)
        startCooldown()
        toast.success(t('Reset link sent to your email'))
      } catch (err) {
        toast.error(extractApiErrorMessage(err, t('Something went wrong')))
      } finally {
        setIsLoading(false)
      }
    },
    [email, cooldown, startCooldown, t],
  )

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: 'var(--app-bg)' }}
    >
      <div className="w-full max-w-[400px]">
        <div className="login-form-card">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white p-2 shadow">
              <img src={hemisLogo} alt="HEMIS" className="h-full w-full object-contain" />
            </div>
          </div>

          {isSent ? (
            /* Success state */
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="mb-2 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {t('Check your email')}
              </h2>
              <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t(
                  'We sent a password reset link to your email address. The link will expire in 15 minutes.',
                )}
              </p>
              <button
                onClick={() => setIsSent(false)}
                disabled={cooldown > 0}
                className="mb-3 text-sm font-medium text-blue-600 hover:underline disabled:text-[var(--text-secondary)] disabled:no-underline"
              >
                {cooldown > 0
                  ? t('Resend in {{seconds}}s', { seconds: cooldown })
                  : t('Resend email')}
              </button>
              <br />
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('Back to login')}
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <div className="mb-6">
                <h2
                  className="mb-1.5 text-xl font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {t('Forgot password?')}
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {t('Enter your email and we will send you a reset link')}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="reset-email"
                    className="mb-2 block text-[13px] font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {t('Email')}
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="login-input"
                    autoComplete="email"
                    required
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email.trim() || cooldown > 0}
                  className="login-submit-btn"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>{t('Loading...')}</span>
                    </>
                  ) : cooldown > 0 ? (
                    <span>
                      {t('Send reset link')} ({cooldown}s)
                    </span>
                  ) : (
                    <span>{t('Send reset link')}</span>
                  )}
                </button>
              </form>

              <div className="mt-4 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t('Back to login')}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
