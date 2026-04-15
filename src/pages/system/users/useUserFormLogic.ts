import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
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
import type { RoleSummary } from '@/types/user.types'

// ─── Tabs ────────────────────────────────────────────────────────────────────
export type TabValue = 'general' | 'roles' | 'security'

// ─── Schemas ─────────────────────────────────────────────────────────────────
const createSchema = z
  .object({
    username: z
      .string()
      .min(3)
      .max(50)
      .regex(/^[a-zA-Z0-9_.-]+$/),
    password: z.string().min(6).max(100),
    confirmPassword: z.string().min(1),
    fullName: z.string().max(255).optional().or(z.literal('')),
    email: z.string().email().max(255).optional().or(z.literal('')),
    phone: z
      .string()
      .regex(/^\+998[0-9]{9}$/, 'Invalid phone format')
      .or(z.literal(''))
      .optional(),
    universityCode: z.string().max(255).optional().or(z.literal('')),
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
  universityCode: z.string().max(255).optional().or(z.literal('')),
  roleIds: z.array(z.string()).min(1),
})

export type CreateFormData = z.infer<typeof createSchema>
export type EditFormData = z.infer<typeof editSchema>
export type FormData = Partial<CreateFormData> & EditFormData

// ─── Change password schema ──────────────────────────────────────────────────
const changePasswordSchema = z
  .object({
    newPassword: z.string().min(6).max(100),
    confirmNewPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  })

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

// ─── Field → Tab mapping (for validation-driven tab switching) ───────────────
const FIELD_TAB_MAP: Record<string, TabValue> = {
  username: 'general',
  fullName: 'general',
  email: 'general',
  phone: 'general',
  universityCode: 'general',
  roleIds: 'roles',
  password: 'security',
  confirmPassword: 'security',
  enabled: 'security',
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useUserFormLogic() {
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
      ? { fullName: '', email: '', phone: '', universityCode: '', roleIds: [] }
      : {
          username: '',
          password: '',
          confirmPassword: '',
          fullName: '',
          email: '',
          phone: '',
          universityCode: '',
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
    getValues: getPasswordValues,
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
        universityCode: user.universityCode ?? '',
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

  const toggleRole = useCallback(
    (roleId: string) => {
      const current = (watch('roleIds') as string[]) ?? []
      const next = current.includes(roleId)
        ? current.filter((rid) => rid !== roleId)
        : [...current, roleId]
      setValue('roleIds', next, { shouldValidate: true })
    },
    [watch, setValue],
  )

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
          universityCode: clean(data.universityCode),
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
          universityCode: clean(data.universityCode),
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
  // NOTE: Direct getValues() approach — react-hook-form handleSubmit
  // doesn't work reliably inside an outer <form>
  const onChangePassword = useCallback(() => {
    if (!id) return
    const values = getPasswordValues()
    if (!values.newPassword || values.newPassword.length < 6) {
      toast.error(t('Password must be at least 6 characters'))
      return
    }
    if (values.newPassword !== values.confirmNewPassword) {
      toast.error(t('Passwords do not match'))
      return
    }
    changePasswordMutation.mutate(
      { id, data: { newPassword: values.newPassword, confirmPassword: values.confirmNewPassword } },
      {
        onSuccess: () => {
          resetPassword()
          setShowNewPassword(false)
          setShowConfirmNewPassword(false)
        },
      },
    )
  }, [id, getPasswordValues, changePasswordMutation, resetPassword, t])

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

  return {
    // identity
    id,
    isEdit,
    user,
    userLoading,

    // navigation
    navigate,

    // tabs
    activeTab,
    handleTabChange,

    // permissions
    hasFullAccess,

    // data
    universities,
    roles: availableRoles,
    groupedRoles,
    selectedRoleIds,

    // main form
    register,
    handleSubmit,
    setValue,
    watch,
    errors,
    isSaving,
    onSubmit,
    onInvalid,

    // roles
    toggleRole,

    // change password form (edit mode)
    registerPassword,
    handlePasswordSubmit,
    passwordErrors,
    showNewPassword,
    setShowNewPassword,
    showConfirmNewPassword,
    setShowConfirmNewPassword,
    changePasswordMutation,
    onChangePassword,

    // create mode password visibility
    showPassword,
    setShowPassword,
    showConfirm,
    setShowConfirm,

    // status / unlock
    toggleStatusMutation,
    onToggleStatus,
    unlockAccountMutation,
    onUnlockAccount,
  }
}
