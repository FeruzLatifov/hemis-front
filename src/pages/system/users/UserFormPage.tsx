import { useTranslation } from 'react-i18next'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Loader2,
  Save,
  User,
  Shield,
  KeyRound,
  Building2,
  Eye,
  EyeOff,
  Power,
  LockOpen,
} from 'lucide-react'
import { useUserFormLogic } from './useUserFormLogic'
import type { FormData } from './useUserFormLogic'
import PasswordChangeDialog from './PasswordChangeDialog'
import RolesTabContent from './RolesTabContent'

// ─── Reusable components ─────────────────────────────────────────────────────

function FormSection({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-[var(--border-color-pro)] bg-[var(--card-bg)] p-6">
      <div className="mb-5 flex items-center gap-2">
        <span className="text-[var(--text-secondary)]">{icon}</span>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
      </div>
      {children}
    </section>
  )
}

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

function FormSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <Skeleton className="h-8 w-48 rounded" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-[var(--border-color-pro)] bg-[var(--card-bg)] p-6"
        >
          <Skeleton className="mb-4 h-5 w-36 rounded" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-10 rounded" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function UserFormPage() {
  const { t } = useTranslation()
  const logic = useUserFormLogic()

  const {
    isEdit,
    user,
    userLoading,
    navigate,
    activeTab,
    handleTabChange,
    hasFullAccess,
    universities,
    groupedRoles,
    roles,
    selectedRoleIds,
    register,
    handleSubmit,
    setValue,
    watch,
    errors,
    isSaving,
    onSubmit,
    onInvalid,
    toggleRole,
    registerPassword,
    passwordErrors,
    showNewPassword,
    setShowNewPassword,
    showConfirmNewPassword,
    setShowConfirmNewPassword,
    changePasswordMutation,
    onChangePassword,
    showPassword,
    setShowPassword,
    showConfirm,
    setShowConfirm,
    toggleStatusMutation,
    onToggleStatus,
    unlockAccountMutation,
    onUnlockAccount,
  } = logic

  // ─── Loading state ───────────────────────────────────────────────────
  if (isEdit && userLoading) {
    return <FormSkeleton />
  }

  if (isEdit && !user && !userLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-[var(--text-primary)]">{t('User not found')}</p>
          <button
            onClick={() => navigate('/system/users')}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            {t('Back to users')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      {/* ── Header ── */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/system/users')}
          className="rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
          aria-label={t('Back')}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            {isEdit ? t('Edit user') : t('Create user')}
          </h1>
          {isEdit && user && (
            <span className="rounded-md bg-[var(--app-bg)] px-2.5 py-1 font-mono text-sm text-[var(--text-secondary)]">
              {user.username}
            </span>
          )}
        </div>
      </div>

      {/* ── Form wrapping tabs ── */}
      <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4 w-full justify-start">
            <TabsTrigger value="general" className="gap-1.5">
              <User className="h-3.5 w-3.5" />
              {t('General')}
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              {t('Roles')}
              {errors.roleIds && <span className="ml-1 h-2 w-2 rounded-full bg-red-500" />}
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5">
              <KeyRound className="h-3.5 w-3.5" />
              {t('Security')}
              {(errors.password || errors.confirmPassword) && (
                <span className="ml-1 h-2 w-2 rounded-full bg-red-500" />
              )}
            </TabsTrigger>
          </TabsList>

          {/* ════════════════════ GENERAL TAB ════════════════════ */}
          <TabsContent value="general" className="space-y-4">
            {/* Profile */}
            <FormSection title={t('Profile')} icon={<User className="h-4 w-4" />}>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                {/* Username (create only) */}
                {!isEdit && (
                  <div className="space-y-1.5">
                    <Label htmlFor="username">
                      {t('Username')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="username"
                      placeholder="john_doe"
                      autoComplete="off"
                      className={errors.username ? 'border-red-400' : ''}
                      {...register('username' as keyof FormData)}
                    />
                    {errors.username && (
                      <p className="text-xs text-red-500">
                        {errors.username.message ||
                          t('Username must be 3-50 characters, letters, digits, _, ., -')}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="fullName">{t('Full name')}</Label>
                  <Input id="fullName" placeholder={t('Full name')} {...register('fullName')} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">{t('Email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    className={errors.email ? 'border-red-400' : ''}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">
                      {errors.email.message || t('Invalid email format')}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">{t('Phone')}</Label>
                  <Input
                    id="phone"
                    placeholder="+998901234567"
                    maxLength={13}
                    className={errors.phone ? 'border-red-400' : ''}
                    {...register('phone')}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-500">
                      {t('Phone number must be in format +998XXXXXXXXX')}
                    </p>
                  )}
                </div>
              </div>
            </FormSection>

            {/* University (full access only) */}
            {hasFullAccess && (
              <FormSection title={t('University')} icon={<Building2 className="h-4 w-4" />}>
                <div className="max-w-sm space-y-1.5">
                  <Select
                    value={watch('universityCode') || '__none__'}
                    onValueChange={(val) =>
                      setValue('universityCode', val === '__none__' ? '' : val, {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('Select university')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">
                        {t('Leave empty for system administrators')}
                      </SelectItem>
                      {universities.map((u) => (
                        <SelectItem key={u.code} value={u.code}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {t('Leave empty for system administrators')}
                  </p>
                </div>
              </FormSection>
            )}
          </TabsContent>

          {/* ════════════════════ ROLES TAB ════════════════════ */}
          <TabsContent value="roles" className="space-y-4">
            <RolesTabContent
              groupedRoles={groupedRoles}
              availableRolesCount={roles.length}
              selectedRoleIds={selectedRoleIds}
              onToggleRole={toggleRole}
              hasError={!!errors.roleIds}
            />
          </TabsContent>

          {/* ════════════════════ SECURITY TAB ════════════════════ */}
          <TabsContent value="security" className="space-y-4">
            {!isEdit ? (
              /* ── CREATE MODE: Password fields as part of the main form ── */
              <>
                <FormSection title={t('Password')} icon={<KeyRound className="h-4 w-4" />}>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <PasswordField
                        id="password"
                        label={t('Password')}
                        show={showPassword}
                        onToggle={() => setShowPassword(!showPassword)}
                        placeholder="--------"
                        error={
                          errors.password ? t('Password must be at least 6 characters') : undefined
                        }
                        {...register('password' as keyof FormData)}
                      />
                    </div>

                    <PasswordField
                      id="confirmPassword"
                      label={t('Confirm password')}
                      show={showConfirm}
                      onToggle={() => setShowConfirm(!showConfirm)}
                      placeholder="--------"
                      error={errors.confirmPassword ? t('Passwords do not match') : undefined}
                      {...register('confirmPassword' as keyof FormData)}
                    />
                  </div>
                </FormSection>

                <FormSection title={t('Account status')} icon={<Power className="h-4 w-4" />}>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1">
                    <Checkbox
                      checked={!!watch('enabled' as keyof FormData)}
                      onCheckedChange={(checked) =>
                        setValue('enabled' as keyof FormData, !!checked as never, {
                          shouldValidate: true,
                        })
                      }
                    />
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {t('Enabled')}
                    </span>
                  </label>
                </FormSection>
              </>
            ) : (
              /* ── EDIT MODE: Independent security actions ── */
              <>
                {/* Change password */}
                <PasswordChangeDialog
                  registerPassword={registerPassword}
                  passwordErrors={passwordErrors}
                  showNewPassword={showNewPassword}
                  setShowNewPassword={setShowNewPassword}
                  showConfirmNewPassword={showConfirmNewPassword}
                  setShowConfirmNewPassword={setShowConfirmNewPassword}
                  isPending={changePasswordMutation.isPending}
                  onChangePassword={onChangePassword}
                />

                {/* Status */}
                <FormSection title={t('Status')} icon={<Power className="h-4 w-4" />}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[var(--text-primary)]">
                        {t('Current status')}:{' '}
                        <span
                          className={`font-medium ${user?.enabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                        >
                          {user?.enabled ? t('Active') : t('Inactive')}
                        </span>
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={toggleStatusMutation.isPending}
                      onClick={onToggleStatus}
                      className={
                        user?.enabled
                          ? 'border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-900/30 dark:text-orange-400'
                          : ''
                      }
                    >
                      {toggleStatusMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {user?.enabled ? t('Disable') : t('Enable')}
                    </Button>
                  </div>
                </FormSection>

                {/* Unlock (only if locked) */}
                {user && !user.accountNonLocked && (
                  <FormSection title={t('Account lock')} icon={<LockOpen className="h-4 w-4" />}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {t('This account is currently locked')}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={unlockAccountMutation.isPending}
                        onClick={onUnlockAccount}
                      >
                        {unlockAccountMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        <LockOpen className="mr-2 h-4 w-4" />
                        {t('Unlock')}
                      </Button>
                    </div>
                  </FormSection>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* ── Sticky Footer ── */}
        <div className="sticky bottom-0 -mx-4 mt-6 flex items-center justify-end gap-3 border-t border-[var(--border-color-pro)] bg-[var(--card-bg)] px-6 py-4">
          <button
            type="button"
            onClick={() => navigate('/system/users')}
            disabled={isSaving}
            className="rounded-lg border border-[var(--border-color-pro)] bg-[var(--card-bg)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] disabled:opacity-50"
          >
            {t('Cancel')}
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 disabled:opacity-50 dark:border-blue-900/30 dark:bg-blue-950/20"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('Saving...')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEdit ? t('Save') : t('Create')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
