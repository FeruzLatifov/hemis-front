import { useState, useCallback } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { passwordResetApi } from '@/api/password-reset.api'
import { extractApiErrorMessage } from '@/utils/error.util'
import hemisLogo from '@/assets/images/hemis-logo-new.png'

const resetSchema = z
  .object({
    password: z.string().min(6).max(100),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ResetFormData = z.infer<typeof resetSchema>

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
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

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
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-4">
        <div className="text-center">
          <p className="mb-4 text-sm text-[var(--text-primary)]">
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
    <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-4">
      <div className="w-full max-w-[400px]">
        <div className="login-form-card">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white p-2 shadow">
              <img src={hemisLogo} alt="HEMIS" className="h-full w-full object-contain" />
            </div>
          </div>

          <div className="mb-6">
            <h2 className="mb-1.5 text-xl font-semibold text-[var(--text-primary)]">
              {t('Set new password')}
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              {t('Enter your new password below')}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* New password */}
            <div>
              <label
                htmlFor="new-password"
                className="mb-2 block text-[13px] font-medium text-[var(--text-primary)]"
              >
                {t('New password')}
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`login-input pr-10 ${errors.password ? 'border-red-400' : ''}`}
                  autoComplete="new-password"
                  disabled={isLoading}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'new-password-error' : undefined}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-[var(--text-secondary)] opacity-40"
                  aria-label={showPassword ? t('Hide password') : t('Show password')}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p id="new-password-error" role="alert" className="mt-1 text-xs text-red-500">
                  {errors.password.message || t('Password must be at least 6 characters')}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-[13px] font-medium text-[var(--text-primary)]"
              >
                {t('Confirm password')}
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  className={`login-input pr-10 ${errors.confirmPassword ? 'border-red-400' : ''}`}
                  autoComplete="new-password"
                  disabled={isLoading}
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-[var(--text-secondary)] opacity-40"
                  aria-label={showConfirm ? t('Hide password') : t('Show password')}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p id="confirm-password-error" role="alert" className="mt-1 text-xs text-red-500">
                  {t('Passwords do not match')}
                </p>
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
