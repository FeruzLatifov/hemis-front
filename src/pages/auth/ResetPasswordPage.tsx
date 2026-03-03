import { useState, useCallback } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Eye, EyeOff, Check, X } from 'lucide-react'
import { passwordResetApi } from '@/api/password-reset.api'
import { extractApiErrorMessage } from '@/utils/error.util'
import hemisLogo from '@/assets/images/hemis-logo-new.png'

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8)
      .max(100)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/,
        'Password must contain uppercase, lowercase, digit, and special character',
      ),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ResetFormData = z.infer<typeof resetSchema>

function PasswordStrength({ password }: { password: string }) {
  const { t } = useTranslation()
  const checks = [
    { label: t('8+ characters'), pass: password.length >= 8 },
    { label: t('Uppercase letter'), pass: /[A-Z]/.test(password) },
    { label: t('Lowercase letter'), pass: /[a-z]/.test(password) },
    { label: t('Number'), pass: /\d/.test(password) },
    { label: t('Special character'), pass: /[\W_]/.test(password) },
  ]
  const strength = checks.filter((c) => c.pass).length

  if (!password) return null

  return (
    <div className="space-y-2 pt-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              strength >= i
                ? strength <= 2
                  ? 'bg-red-400'
                  : strength <= 3
                    ? 'bg-yellow-400'
                    : 'bg-green-400'
                : 'bg-[var(--border-color-pro)]'
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
        {checks.map((check) => (
          <span
            key={check.label}
            className={`inline-flex items-center gap-1 text-[11px] ${
              check.pass ? 'text-green-600 dark:text-green-400' : 'text-[var(--text-secondary)]'
            }`}
          >
            {check.pass ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {check.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const passwordValue = watch('password') || ''

  const onSubmit = useCallback(
    async (data: ResetFormData) => {
      if (!token) {
        toast.error(t('Invalid reset link'))
        return
      }

      setIsLoading(true)
      try {
        await passwordResetApi.resetPassword({ token, password: data.password })
        toast.success(t('Password has been reset successfully'))
        navigate('/login', { replace: true })
      } catch (err) {
        toast.error(extractApiErrorMessage(err, t('Something went wrong')))
      } finally {
        setIsLoading(false)
      }
    },
    [token, navigate, t],
  )

  if (!token) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4"
        style={{ backgroundColor: 'var(--app-bg)' }}
      >
        <div className="text-center">
          <p className="mb-4 text-sm" style={{ color: 'var(--text-primary)' }}>
            {t('Invalid or missing reset token')}
          </p>
          <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:underline">
            {t('Request a new reset link')}
          </Link>
        </div>
      </div>
    )
  }

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

          <div className="mb-6">
            <h2 className="mb-1.5 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('Set new password')}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {t('Enter your new password below')}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* New password */}
            <div>
              <label
                htmlFor="new-password"
                className="mb-2 block text-[13px] font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                {t('New password')}
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`login-input ${errors.password ? 'border-red-400' : ''}`}
                  style={{ paddingRight: 40 }}
                  autoComplete="new-password"
                  disabled={isLoading}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2"
                  style={{ color: 'var(--text-secondary)', opacity: 0.4 }}
                  aria-label={showPassword ? t('Hide password') : t('Show password')}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.password.message || t('Password must be at least 8 characters')}
                </p>
              )}
              <PasswordStrength password={passwordValue} />
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-[13px] font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                {t('Confirm password')}
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  className={`login-input ${errors.confirmPassword ? 'border-red-400' : ''}`}
                  style={{ paddingRight: 40 }}
                  autoComplete="new-password"
                  disabled={isLoading}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute top-1/2 right-3 -translate-y-1/2"
                  style={{ color: 'var(--text-secondary)', opacity: 0.4 }}
                  aria-label={showConfirm ? t('Hide password') : t('Show password')}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">{t('Passwords do not match')}</p>
              )}
            </div>

            <div className="pt-1">
              <button type="submit" disabled={isLoading} className="login-submit-btn">
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>{t('Loading...')}</span>
                  </>
                ) : (
                  <span>{t('Reset password')}</span>
                )}
              </button>
            </div>
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
        </div>
      </div>
    </div>
  )
}
