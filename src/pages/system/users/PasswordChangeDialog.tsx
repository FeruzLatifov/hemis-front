import { useTranslation } from 'react-i18next'
import { UseFormRegister } from 'react-hook-form'
import { Loader2, Eye, EyeOff, KeyRound } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { ChangePasswordFormData } from './useUserFormLogic'

// ─── Reusable password field ─────────────────────────────────────────────────
function PasswordField({
  id,
  label,
  show,
  onToggle,
  error,
  ...inputProps
}: {
  id: string
  label: string
  show: boolean
  onToggle: () => void
  error?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const { t } = useTranslation()
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label} <span className="text-red-500">*</span>
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          className={error ? 'border-red-400 pr-10' : 'pr-10'}
          {...inputProps}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          aria-label={show ? t('Hide password') : t('Show password')}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface PasswordChangeDialogProps {
  registerPassword: UseFormRegister<ChangePasswordFormData>
  passwordErrors: Partial<Record<keyof ChangePasswordFormData, { message?: string }>>
  showNewPassword: boolean
  setShowNewPassword: (show: boolean) => void
  showConfirmNewPassword: boolean
  setShowConfirmNewPassword: (show: boolean) => void
  isPending: boolean
  onChangePassword: () => void
}

export default function PasswordChangeDialog({
  registerPassword,
  passwordErrors,
  showNewPassword,
  setShowNewPassword,
  showConfirmNewPassword,
  setShowConfirmNewPassword,
  isPending,
  onChangePassword,
}: PasswordChangeDialogProps) {
  const { t } = useTranslation()

  return (
    <section className="rounded-xl border border-[var(--border-color-pro)] bg-[var(--card-bg)] p-6">
      <div className="mb-5 flex items-center gap-2">
        <span className="text-[var(--text-secondary)]">
          <KeyRound className="h-4 w-4" />
        </span>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          {t('Change password')}
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <PasswordField
            id="newPassword"
            label={t('New password')}
            show={showNewPassword}
            onToggle={() => setShowNewPassword(!showNewPassword)}
            placeholder="--------"
            error={
              passwordErrors.newPassword ? t('Password must be at least 6 characters') : undefined
            }
            {...registerPassword('newPassword')}
          />
        </div>

        <PasswordField
          id="confirmNewPassword"
          label={t('Confirm password')}
          show={showConfirmNewPassword}
          onToggle={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
          placeholder="--------"
          error={passwordErrors.confirmNewPassword ? t('Passwords do not match') : undefined}
          {...registerPassword('confirmNewPassword')}
        />
      </div>
      <div className="mt-4">
        <Button type="button" variant="outline" disabled={isPending} onClick={onChangePassword}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('Change password')}
        </Button>
      </div>
    </section>
  )
}
