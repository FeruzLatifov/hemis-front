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
import { usersApi } from '@/api/users.api'
import type { RoleSummary, AccountType, GovPerson } from '@/types/user.types'

// ─── Tabs ────────────────────────────────────────────────────────────────────
export type TabValue = 'general' | 'roles' | 'security'

// ─── Person lookup ─────────────────────────────────────────────────────────
export type LookupStatus = 'idle' | 'loading' | 'found' | 'notfound' | 'error'

/** Person fields carried into the payload but not shown as dedicated inputs. */
interface PersonMeta {
  firstName?: string
  lastName?: string
  middleName?: string
  birthPlace?: string
  passportGivePlace?: string
  passportIssuedDate?: string
  passportExpiryDate?: string
  photo?: string
}

// ─── Schemas ─────────────────────────────────────────────────────────────────
// Create schema is account-type aware (superRefine): PERSON → PINFL is the login;
// UNIVERSITY_LOGIN → manual username + university are required.
const createSchema = z
  .object({
    accountType: z.enum(['PERSON', 'UNIVERSITY_LOGIN']),
    // PERSON
    pinfl: z.string().optional().or(z.literal('')),
    passport: z.string().max(16).optional().or(z.literal('')),
    // UNIVERSITY_LOGIN
    username: z.string().optional().or(z.literal('')),
    // common
    password: z.string().min(6).max(100),
    fullName: z.string().max(255).optional().or(z.literal('')),
    birthDate: z.string().optional().or(z.literal('')),
    gender: z.string().max(10).optional().or(z.literal('')),
    nationality: z.string().max(64).optional().or(z.literal('')),
    address: z.string().max(512).optional().or(z.literal('')),
    email: z.string().email().max(255).optional().or(z.literal('')),
    phone: z
      .string()
      .regex(/^\+998[0-9]{9}$/, 'Invalid phone format')
      .or(z.literal(''))
      .optional(),
    universityCode: z.string().max(255).optional().or(z.literal('')),
    roleIds: z.array(z.string()).min(1),
  })
  .superRefine((data, ctx) => {
    if (data.accountType === 'PERSON') {
      if (!/^\d{14}$/.test(data.pinfl ?? '')) {
        ctx.addIssue({ code: 'custom', path: ['pinfl'], message: 'PINFL must be 14 digits' })
      }
    } else {
      const u = data.username ?? ''
      if (u.length < 3 || u.length > 50 || !/^[a-zA-Z0-9_.-]+$/.test(u)) {
        ctx.addIssue({
          code: 'custom',
          path: ['username'],
          message: 'Username must be 3-50 characters',
        })
      }
      if (!data.universityCode) {
        ctx.addIssue({
          code: 'custom',
          path: ['universityCode'],
          message: 'University is required',
        })
      }
    }
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
  accountType: 'general',
  pinfl: 'general',
  passport: 'general',
  username: 'general',
  fullName: 'general',
  email: 'general',
  phone: 'general',
  birthDate: 'general',
  gender: 'general',
  nationality: 'general',
  address: 'general',
  universityCode: 'general',
  roleIds: 'roles',
  password: 'security',
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
          accountType: 'PERSON',
          pinfl: '',
          passport: '',
          username: '',
          password: '',
          fullName: '',
          birthDate: '',
          gender: '',
          nationality: '',
          address: '',
          email: '',
          phone: '',
          universityCode: '',
          roleIds: [],
        },
  })

  const accountType = (watch('accountType') as AccountType) ?? 'PERSON'

  const setAccountType = useCallback(
    (next: AccountType) => {
      setValue('accountType', next, { shouldValidate: false })
    },
    [setValue],
  )

  // ─── Person lookup (GUVD/api_mspd autofill) ──────────────────────────
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle')
  const [personMeta, setPersonMeta] = useState<PersonMeta>({})
  const [personPhoto, setPersonPhoto] = useState<string | undefined>(undefined)

  const runPersonLookup = useCallback(async () => {
    const pinfl = ((watch('pinfl') as string) ?? '').trim()
    const passport = ((watch('passport') as string) ?? '').trim()
    if (!/^\d{14}$/.test(pinfl)) {
      setError('pinfl' as keyof FormData, { message: t('PINFL must be 14 digits') })
      return
    }
    if (!passport && !((watch('birthDate') as string) ?? '').trim()) {
      toast.error(t('Enter passport or birth date to fetch person data'))
      return
    }
    setLookupStatus('loading')
    try {
      const birthDate = ((watch('birthDate') as string) ?? '').trim()
      const person: GovPerson | null = await usersApi.personLookup(
        pinfl,
        passport || undefined,
        birthDate || undefined,
      )
      if (!person) {
        setLookupStatus('notfound')
        toast.error(t('Person not found'))
        return
      }
      // Autofill visible fields
      setValue('fullName', person.fullName ?? '', { shouldValidate: true })
      if (person.birthDate) setValue('birthDate', person.birthDate, { shouldValidate: false })
      if (person.passport) setValue('passport', person.passport, { shouldValidate: false })
      if (person.gender) setValue('gender', person.gender, { shouldValidate: false })
      if (person.nationality) setValue('nationality', person.nationality, { shouldValidate: false })
      if (person.address) setValue('address', person.address, { shouldValidate: false })
      // Carry the rest into the payload
      setPersonMeta({
        firstName: person.firstName ?? undefined,
        lastName: person.lastName ?? undefined,
        middleName: person.middleName ?? undefined,
        birthPlace: person.birthPlace ?? undefined,
        passportGivePlace: person.passportGivePlace ?? undefined,
        passportIssuedDate: person.passportIssuedDate ?? undefined,
        passportExpiryDate: person.passportExpiryDate ?? undefined,
        photo: person.photo ?? undefined,
      })
      setPersonPhoto(person.photo ?? undefined)
      setLookupStatus('found')
      toast.success(t('Person data loaded'))
    } catch {
      setLookupStatus('error')
      toast.error(t('Failed to fetch person data'))
    }
  }, [watch, setValue, setError, t])

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
      const clean = (val: unknown) =>
        typeof val === 'string' && val.trim() ? val.trim() : undefined

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
        return
      }

      const d = data as CreateFormData
      const isUniversityLogin = d.accountType === 'UNIVERSITY_LOGIN'

      const createData = isUniversityLogin
        ? {
            accountType: 'UNIVERSITY_LOGIN' as AccountType,
            username: (d.username ?? '').trim(),
            password: d.password,
            fullName: clean(d.fullName),
            email: clean(d.email),
            phone: clean(d.phone),
            universityCode: clean(d.universityCode),
            roleIds: d.roleIds,
          }
        : {
            accountType: 'PERSON' as AccountType,
            username: (d.pinfl ?? '').trim(), // login = PINFL
            password: d.password,
            pinfl: (d.pinfl ?? '').trim(),
            passport: clean(d.passport),
            fullName: clean(d.fullName),
            firstName: clean(personMeta.firstName),
            lastName: clean(personMeta.lastName),
            middleName: clean(personMeta.middleName),
            birthDate: clean(d.birthDate),
            birthPlace: clean(personMeta.birthPlace),
            passportGivePlace: clean(personMeta.passportGivePlace),
            passportIssuedDate: clean(personMeta.passportIssuedDate),
            passportExpiryDate: clean(personMeta.passportExpiryDate),
            gender: clean(d.gender),
            nationality: clean(d.nationality),
            address: clean(d.address),
            photo: personMeta.photo,
            email: clean(d.email),
            phone: clean(d.phone),
            universityCode: clean(d.universityCode),
            roleIds: d.roleIds,
          }

      createMutation.mutate(createData, {
        onSuccess: () => navigate('/system/users'),
        onError: (error) => {
          const status = getErrorStatus(error)
          const message = extractApiErrorMessage(error, '').toLowerCase()
          if (status === 409 || message.includes('pinfl')) {
            setError('pinfl' as keyof FormData, {
              message: t('A user with this PINFL already exists'),
            })
            setActiveTab('general')
          } else if (message.includes('username')) {
            setError('username' as keyof FormData, { message: t('Username already exists') })
            setActiveTab('general')
          }
        },
      })
    },
    [isEdit, id, updateMutation, createMutation, navigate, setError, t, personMeta],
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

    // account type + person lookup
    accountType,
    setAccountType,
    lookupStatus,
    runPersonLookup,
    personPhoto,

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

    // status / unlock
    toggleStatusMutation,
    onToggleStatus,
    unlockAccountMutation,
    onUnlockAccount,
  }
}
