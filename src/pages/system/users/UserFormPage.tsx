import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import {
  useUserById,
  useRoles,
  useCreateUser,
  useUpdateUser,
  useChangePassword,
  useToggleStatus,
  useUnlockAccount,
} from '@/hooks/useUsers'
import { useUniversities } from '@/hooks/useUniversities'
import { useAuthStore } from '@/stores/authStore'
import { extractApiErrorMessage, getErrorStatus } from '@/utils/error.util'
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
  Check,
  X,
  Power,
  LockOpen,
} from 'lucide-react'
import type { RoleSummary } from '@/types/user.types'

// ─── Tabs ────────────────────────────────────────────────────────────────────
type TabValue = 'general' | 'roles' | 'security'

// ─── Schemas ─────────────────────────────────────────────────────────────────
const createSchema = z
  .object({
    username: z
      .string()
      .min(3)
      .max(50)
      .regex(/^[a-zA-Z0-9_.-]+$/),
    password: z
      .string()
      .min(8)
      .max(100)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/,
        'Password must contain uppercase, lowercase, digit, and special character',
      ),
    confirmPassword: z.string().min(1),
    fullName: z.string().max(255).optional().or(z.literal('')),
    email: z.string().email().max(255).optional().or(z.literal('')),
    phone: z
      .string()
      .regex(/^\+998[0-9]{9}$/, 'Invalid phone format')
      .or(z.literal(''))
      .optional(),
    entityCode: z.string().max(255).optional().or(z.literal('')),
    roleIds: z.array(z.string()).min(1),
    enabled: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

const editSchema = z.object({
  fullName: z.string().max(255).optional().or(z.literal('')),
  email: z.string().email().max(255).optional().or(z.literal('')),
  phone: z
    .string()
    .regex(/^\+998[0-9]{9}$/, 'Invalid phone format')
    .or(z.literal(''))
    .optional(),
  entityCode: z.string().max(255).optional().or(z.literal('')),
  roleIds: z.array(z.string()).min(1),
})

type CreateFormData = z.infer<typeof createSchema>
type EditFormData = z.infer<typeof editSchema>
type FormData = CreateFormData | EditFormData

// ─── Change password schema ──────────────────────────────────────────────────
const changePasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8)
      .max(100)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/,
        'Password must contain uppercase, lowercase, digit, and special character',
      ),
    confirmNewPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  })

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

// ─── Field → Tab mapping (for validation-driven tab switching) ───────────────
const FIELD_TAB_MAP: Record<string, TabValue> = {
  username: 'general',
  fullName: 'general',
  email: 'general',
  phone: 'general',
  entityCode: 'general',
  roleIds: 'roles',
  password: 'security',
  confirmPassword: 'security',
  enabled: 'security',
}

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
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { permissions } = useAuthStore()

  const isEdit = !!id
  const initialTab = (searchParams.get('tab') as TabValue) || 'general'
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab)

  // ─── Permissions ─────────────────────────────────────────────────────
  const canCreate = permissions.includes('users.create') || permissions.includes('users.manage')
  const canEdit = permissions.includes('users.edit') || permissions.includes('users.manage')
  const hasFullAccess =
    (canEdit || canCreate) &&
    (permissions.includes('universities.view') || permissions.includes('settings.view'))

  // ─── Data fetching ───────────────────────────────────────────────────
  const { data: user, isLoading: userLoading } = useUserById(id ?? '')
  const { data: roles = [] } = useRoles()
  const { data: universitiesData } = useUniversities(
    { size: 1000, sort: 'name,asc' },
    { enabled: hasFullAccess },
  )
  const universities = useMemo(() => universitiesData?.content ?? [], [universitiesData?.content])

  // ─── Mutations ───────────────────────────────────────────────────────
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()
  const changePasswordMutation = useChangePassword()
  const toggleStatusMutation = useToggleStatus()
  const unlockAccountMutation = useUnlockAccount()

  const isSaving = createMutation.isPending || updateMutation.isPending

  // ─── Main form ───────────────────────────────────────────────────────
  const schema = isEdit ? editSchema : createSchema
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: isEdit
      ? { fullName: '', email: '', phone: '', entityCode: '', roleIds: [] }
      : {
          username: '',
          password: '',
          confirmPassword: '',
          fullName: '',
          email: '',
          phone: '',
          entityCode: '',
          roleIds: [],
          enabled: true,
        },
  })

  // ─── Change password form (edit only) ────────────────────────────────
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    watch: watchPassword,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { newPassword: '', confirmNewPassword: '' },
  })

  // ─── Create mode password visibility ─────────────────────────────────
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // ─── Populate form when user data loads ──────────────────────────────
  useEffect(() => {
    if (isEdit && user) {
      reset({
        fullName: user.fullName ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        entityCode: user.entityCode ?? '',
        roleIds: user.roles.map((r) => r.id),
      })
    }
  }, [isEdit, user, reset])

  // ─── Tab change handler (syncs URL) ──────────────────────────────────
  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab as TabValue)
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (tab === 'general') {
            next.delete('tab')
          } else {
            next.set('tab', tab)
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  // ─── Roles ───────────────────────────────────────────────────────────
  const selectedRoleIds = (watch('roleIds') as string[]) ?? []
  const passwordValue = (!isEdit ? (watch('password' as keyof CreateFormData) as string) : '') || ''

  const toggleRole = (roleId: string) => {
    const current = selectedRoleIds
    const next = current.includes(roleId)
      ? current.filter((rid) => rid !== roleId)
      : [...current, roleId]
    setValue('roleIds', next, { shouldValidate: true })
  }

  const availableRoles = hasFullAccess ? roles : roles.filter((r) => r.roleType !== 'SYSTEM')

  const groupedRoles = useMemo(() => {
    const groups: Record<string, RoleSummary[]> = { SYSTEM: [], UNIVERSITY: [], CUSTOM: [] }
    availableRoles.forEach((r) => {
      if (groups[r.roleType]) {
        groups[r.roleType].push(r)
      } else {
        groups.CUSTOM.push(r)
      }
    })
    return groups
  }, [availableRoles])

  // ─── Form submit ─────────────────────────────────────────────────────
  const onSubmit = useCallback(
    (data: FormData) => {
      const clean = (val: unknown) => (typeof val === 'string' && val.trim() ? val : undefined)

      if (isEdit && id) {
        const updateData = {
          fullName: clean(data.fullName),
          email: clean(data.email),
          phone: clean(data.phone),
          entityCode: clean(data.entityCode),
          roleIds: data.roleIds,
        }
        updateMutation.mutate(
          { id, data: updateData },
          {
            onSuccess: () => navigate('/system/users'),
            onError: (error) => {
              const status = getErrorStatus(error)
              const message = extractApiErrorMessage(error, '')
              if (status === 409 || message.toLowerCase().includes('email')) {
                setError('email', { message: t('Email already in use') })
                setActiveTab('general')
              }
            },
          },
        )
      } else {
        const createData = {
          username: (data as CreateFormData).username,
          password: (data as CreateFormData).password,
          fullName: clean(data.fullName),
          email: clean(data.email),
          phone: clean(data.phone),
          entityCode: clean(data.entityCode),
          roleIds: data.roleIds,
          enabled: (data as CreateFormData).enabled,
        }
        createMutation.mutate(createData, {
          onSuccess: () => navigate('/system/users'),
          onError: (error) => {
            const status = getErrorStatus(error)
            const message = extractApiErrorMessage(error, '')
            if (status === 409 || message.toLowerCase().includes('username')) {
              setError('username' as keyof FormData, { message: t('Username already exists') })
              setActiveTab('general')
            }
          },
        })
      }
    },
    [isEdit, id, updateMutation, createMutation, navigate, setError, t],
  )

  // ─── Tab-aware validation: switch to first tab with error ────────────
  const onInvalid = useCallback(
    (fieldErrors: Record<string, unknown>) => {
      for (const field of Object.keys(fieldErrors)) {
        const tab = FIELD_TAB_MAP[field]
        if (tab) {
          handleTabChange(tab)
          return
        }
      }
    },
    [handleTabChange],
  )

  // ─── Change password handler (edit security tab) ─────────────────────
  const onChangePassword = useCallback(
    (data: ChangePasswordFormData) => {
      if (!id) return
      changePasswordMutation.mutate(
        { id, data: { newPassword: data.newPassword, confirmPassword: data.confirmNewPassword } },
        {
          onSuccess: () => {
            resetPassword()
            setShowNewPassword(false)
            setShowConfirmNewPassword(false)
          },
        },
      )
    },
    [id, changePasswordMutation, resetPassword],
  )

  // ─── Toggle status handler ───────────────────────────────────────────
  const onToggleStatus = useCallback(() => {
    if (!id) return
    toggleStatusMutation.mutate(id)
  }, [id, toggleStatusMutation])

  // ─── Unlock handler ──────────────────────────────────────────────────
  const onUnlockAccount = useCallback(() => {
    if (!id) return
    unlockAccountMutation.mutate(id)
  }, [id, unlockAccountMutation])

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

  const newPasswordValue = watchPassword('newPassword') || ''

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
                    value={watch('entityCode') || '__none__'}
                    onValueChange={(val) =>
                      setValue('entityCode', val === '__none__' ? '' : val, {
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
            <FormSection title={t('Roles')} icon={<Shield className="h-4 w-4" />}>
              <div className="space-y-3">
                <div className="max-h-96 space-y-2 overflow-y-auto rounded-md border border-[var(--border-color-pro)] bg-[var(--app-bg)] p-3">
                  {Object.entries(groupedRoles).map(
                    ([type, typeRoles]) =>
                      typeRoles.length > 0 && (
                        <div key={type}>
                          <p className="mb-1.5 px-2 text-[10px] font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
                            {t(type)}
                          </p>
                          {typeRoles.map((role) => {
                            const isChecked = selectedRoleIds.includes(role.id)
                            return (
                              // eslint-disable-next-line jsx-a11y/label-has-associated-control
                              <label
                                key={role.id}
                                className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 transition-colors ${
                                  isChecked ? 'bg-[var(--active-bg)]' : 'hover:bg-[var(--hover-bg)]'
                                }`}
                              >
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={() => toggleRole(role.id)}
                                />
                                <div className="min-w-0 flex-1">
                                  <span className="text-sm font-medium text-[var(--text-primary)]">
                                    {role.name}
                                  </span>
                                  <span className="ml-1.5 text-[10px] text-[var(--text-secondary)]">
                                    ({role.code})
                                  </span>
                                </div>
                              </label>
                            )
                          })}
                        </div>
                      ),
                  )}
                  {availableRoles.length === 0 && (
                    <p className="px-2 py-3 text-center text-sm text-[var(--text-secondary)]">
                      {t('No roles available')}
                    </p>
                  )}
                </div>
                {errors.roleIds && (
                  <p className="text-xs text-red-500">{t('At least one role is required')}</p>
                )}
              </div>
            </FormSection>
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
                          errors.password ? t('Password must be at least 8 characters') : undefined
                        }
                        {...register('password' as keyof FormData)}
                      />
                      <PasswordStrength password={passwordValue} />
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
                      checked={watch('enabled' as keyof FormData) as boolean}
                      onCheckedChange={(checked) =>
                        setValue('enabled' as keyof FormData, !!checked, {
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
                <FormSection title={t('Change password')} icon={<KeyRound className="h-4 w-4" />}>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <PasswordField
                        id="newPassword"
                        label={t('New password')}
                        show={showNewPassword}
                        onToggle={() => setShowNewPassword(!showNewPassword)}
                        placeholder="--------"
                        error={
                          passwordErrors.newPassword
                            ? t('Password must be at least 8 characters')
                            : undefined
                        }
                        {...registerPassword('newPassword')}
                      />
                      <PasswordStrength password={newPasswordValue} />
                    </div>

                    <PasswordField
                      id="confirmNewPassword"
                      label={t('Confirm password')}
                      show={showConfirmNewPassword}
                      onToggle={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      placeholder="--------"
                      error={
                        passwordErrors.confirmNewPassword ? t('Passwords do not match') : undefined
                      }
                      {...registerPassword('confirmNewPassword')}
                    />
                  </div>
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={changePasswordMutation.isPending}
                      onClick={handlePasswordSubmit(onChangePassword)}
                    >
                      {changePasswordMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t('Change password')}
                    </Button>
                  </div>
                </FormSection>

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
