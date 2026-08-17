import { useTranslation } from 'react-i18next'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { SearchableSelect, ALL_VALUE } from '@/components/filters/SearchableSelect'
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
  Fingerprint,
  Search,
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

function Field({
  id,
  label,
  error,
  required,
  children,
}: {
  id: string
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label} {required && <span className="text-red-600 dark:text-red-400">*</span>}
      </Label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
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
        {label} <span className="text-red-600 dark:text-red-400">*</span>
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
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
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
    accountType,
    setAccountType,
    lookupStatus,
    runPersonLookup,
    personPhoto,
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
    toggleStatusMutation,
    onToggleStatus,
    unlockAccountMutation,
    onUnlockAccount,
  } = logic

  const isUniversityLogin = accountType === 'UNIVERSITY_LOGIN'

  // ─── Loading / not-found ─────────────────────────────────────────────
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

  // ─── Shared field blocks ─────────────────────────────────────────────
  const universitySection = hasFullAccess && (
    <FormSection title={t('University')} icon={<Building2 className="h-4 w-4" />}>
      <div className="max-w-sm space-y-1.5">
        <SearchableSelect
          className="w-full"
          value={watch('universityCode') || ALL_VALUE}
          onChange={(val) =>
            setValue('universityCode', val === ALL_VALUE ? '' : val, { shouldValidate: true })
          }
          options={universities.map((u) => ({ code: u.code, name: u.name }))}
          placeholder={t('Select university')}
          allLabel={
            isUniversityLogin ? t('Select university') : t('Leave empty for system administrators')
          }
          searchPlaceholder={t('Search')}
          emptyLabel={t('No data found')}
        />
        {errors.universityCode ? (
          <p role="alert" className="text-xs text-red-600 dark:text-red-400">
            {t('University is required')}
          </p>
        ) : (
          <p className="text-xs text-[var(--text-secondary)]">
            {isUniversityLogin
              ? t('Required for a university login.')
              : t('Leave empty for system administrators')}
          </p>
        )}
      </div>
    </FormSection>
  )

  const contactFields = (
    <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
      <Field
        id="email"
        label={t('Email')}
        error={errors.email ? t('Invalid email format') : undefined}
      >
        <Input
          id="email"
          type="email"
          placeholder="user@example.com"
          className={errors.email ? 'border-red-400' : ''}
          {...register('email')}
        />
      </Field>
      <Field
        id="phone"
        label={t('Phone')}
        error={errors.phone ? t('Phone number must be in format +998XXXXXXXXX') : undefined}
      >
        <Input
          id="phone"
          placeholder="+998901234567"
          maxLength={13}
          className={errors.phone ? 'border-red-400' : ''}
          {...register('phone')}
        />
      </Field>
    </div>
  )

  // ─── Create-mode sections (single page, no tabs) ─────────────────────
  const accountTypeSection = (
    <FormSection title={t('Account type')} icon={<User className="h-4 w-4" />}>
      <div className="inline-flex rounded-lg border border-[var(--border-color-pro)] bg-[var(--app-bg)] p-1">
        <button
          type="button"
          onClick={() => setAccountType('PERSON')}
          className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
            !isUniversityLogin
              ? 'bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Fingerprint className="h-3.5 w-3.5" />
          {t('Person (staff)')}
        </button>
        <button
          type="button"
          onClick={() => setAccountType('UNIVERSITY_LOGIN')}
          className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
            isUniversityLogin
              ? 'bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          {t('University login')}
        </button>
      </div>
      <p className="mt-2.5 text-xs text-[var(--text-secondary)]">
        {isUniversityLogin
          ? t('Service login for the old-hemis connection method (manual username + password).')
          : t(
              'Ministry/university staff. Login is the PINFL; details are fetched from the passport service.',
            )}
      </p>
    </FormSection>
  )

  const personSection = (
    <FormSection title={t('Person')} icon={<Fingerprint className="h-4 w-4" />}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
          <Field
            id="pinfl"
            label={t('PINFL')}
            required
            error={errors.pinfl ? t('PINFL must be 14 digits') : undefined}
          >
            <Input
              id="pinfl"
              placeholder="31507976020031"
              maxLength={14}
              inputMode="numeric"
              className={errors.pinfl ? 'border-red-400' : ''}
              {...register('pinfl' as keyof FormData)}
            />
          </Field>

          <Field id="passport" label={t('Passport (series + number)')}>
            <div className="flex gap-2">
              <Input
                id="passport"
                placeholder="AB1234567"
                maxLength={16}
                className="uppercase"
                {...register('passport' as keyof FormData)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={runPersonLookup}
                disabled={lookupStatus === 'loading'}
                className="shrink-0"
              >
                {lookupStatus === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-1.5 hidden sm:inline">{t('Fetch')}</span>
              </Button>
            </div>
          </Field>
        </div>

        <div className="rounded-lg bg-[var(--app-bg)] px-3 py-2 text-xs text-[var(--text-secondary)]">
          {t('Login')}:{' '}
          <span className="font-mono text-[var(--text-primary)]">
            {(watch('pinfl') as string) || '—'}
          </span>{' '}
          · {t('The login is automatically set to the PINFL.')}
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
          <Field id="fullName" label={t('Full name')}>
            <Input id="fullName" placeholder={t('Full name')} {...register('fullName')} />
          </Field>
          <Field id="birthDate" label={t('Birth date')}>
            <Input id="birthDate" type="date" {...register('birthDate' as keyof FormData)} />
          </Field>
          <Field id="gender" label={t('Gender')}>
            <Input id="gender" {...register('gender' as keyof FormData)} />
          </Field>
          <Field id="nationality" label={t('Nationality')}>
            <Input id="nationality" {...register('nationality' as keyof FormData)} />
          </Field>
          <div className="md:col-span-2">
            <Field id="address" label={t('Address')}>
              <Input id="address" {...register('address' as keyof FormData)} />
            </Field>
          </div>
        </div>

        {personPhoto && (
          <div className="flex items-center gap-3">
            <img
              src={`data:image/jpeg;base64,${personPhoto}`}
              alt={t('Photo')}
              className="h-20 w-16 rounded-md border border-[var(--border-color-pro)] object-cover"
            />
            <span className="text-xs text-[var(--text-secondary)]">{t('Photo')}</span>
          </div>
        )}

        {contactFields}
      </div>
    </FormSection>
  )

  const universityLoginSection = (
    <FormSection title={t('University login')} icon={<Building2 className="h-4 w-4" />}>
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
        <Field
          id="username"
          label={t('Username')}
          required
          error={
            errors.username
              ? t('Username must be 3-50 characters, letters, digits, _, ., -')
              : undefined
          }
        >
          <Input
            id="username"
            placeholder="otm_101"
            autoComplete="off"
            className={errors.username ? 'border-red-400' : ''}
            {...register('username' as keyof FormData)}
          />
        </Field>
        <Field id="fullName" label={t('Display name')}>
          <Input id="fullName" placeholder={t('Display name')} {...register('fullName')} />
        </Field>
      </div>
      <div className="mt-4">{contactFields}</div>
    </FormSection>
  )

  const passwordSection = (
    <FormSection title={t('Password')} icon={<KeyRound className="h-4 w-4" />}>
      <div className="max-w-sm">
        <PasswordField
          id="password"
          label={t('Password')}
          show={showPassword}
          onToggle={() => setShowPassword(!showPassword)}
          placeholder="--------"
          error={errors.password ? t('Password must be at least 6 characters') : undefined}
          {...register('password' as keyof FormData)}
        />
        <p className="mt-2 text-xs text-[var(--text-secondary)]">
          {t('The new account is enabled by default.')}
        </p>
      </div>
    </FormSection>
  )

  const rolesSection = (
    <RolesTabContent
      groupedRoles={groupedRoles}
      availableRolesCount={roles.length}
      selectedRoleIds={selectedRoleIds}
      onToggleRole={toggleRole}
      hasError={!!errors.roleIds}
    />
  )

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

      <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
        {!isEdit ? (
          /* ════════ CREATE — single scrollable page (no tabs) ════════ */
          <div className="space-y-4">
            {accountTypeSection}
            {isUniversityLogin ? universityLoginSection : personSection}
            {universitySection}
            {rolesSection}
            {passwordSection}
          </div>
        ) : (
          /* ════════ EDIT — tabbed (rich entity + independent actions) ════════ */
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
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <FormSection title={t('Profile')} icon={<User className="h-4 w-4" />}>
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                  <Field id="fullName" label={t('Full name')}>
                    <Input id="fullName" placeholder={t('Full name')} {...register('fullName')} />
                  </Field>
                  <Field
                    id="email"
                    label={t('Email')}
                    error={errors.email ? t('Invalid email format') : undefined}
                  >
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      {...register('email')}
                    />
                  </Field>
                  <Field
                    id="phone"
                    label={t('Phone')}
                    error={
                      errors.phone ? t('Phone number must be in format +998XXXXXXXXX') : undefined
                    }
                  >
                    <Input
                      id="phone"
                      placeholder="+998901234567"
                      maxLength={13}
                      {...register('phone')}
                    />
                  </Field>
                </div>
              </FormSection>
              {universitySection}
            </TabsContent>

            <TabsContent value="roles" className="space-y-4">
              {rolesSection}
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
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
            </TabsContent>
          </Tabs>
        )}

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
