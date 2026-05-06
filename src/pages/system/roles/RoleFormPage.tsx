import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { useRoleById, useAllPermissions, useCreateRole, useUpdateRole } from '@/hooks/useRoles'
import { extractApiErrorMessage, getErrorStatus } from '@/utils/error.util'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Loader2, Save, Shield, KeyRound, Search } from 'lucide-react'
import type { PermissionItem } from '@/types/role.types'

// ─── Tabs ────────────────────────────────────────────────────────────────────
type TabValue = 'general' | 'permissions'

// ─── Schemas ─────────────────────────────────────────────────────────────────
const createSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Code must be uppercase letters, digits, and underscores'),
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional().or(z.literal('')),
  permissionIds: z.array(z.string()),
})

const editSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional().or(z.literal('')),
  permissionIds: z.array(z.string()),
})

type CreateFormData = z.infer<typeof createSchema>
type EditFormData = z.infer<typeof editSchema>
type FormData = Partial<CreateFormData> & EditFormData

// ─── Field → Tab mapping ─────────────────────────────────────────────────────
const FIELD_TAB_MAP: Record<string, TabValue> = {
  code: 'general',
  name: 'general',
  description: 'general',
  permissionIds: 'permissions',
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

function FormSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <Skeleton className="h-8 w-48 rounded" />
      {Array.from({ length: 2 }).map((_, i) => (
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

export default function RoleFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const isEdit = !!id
  const initialTab = (searchParams.get('tab') as TabValue) || 'general'
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab)
  const [permissionSearch, setPermissionSearch] = useState('')

  // ─── Data fetching ─────────────────────────────────────────────────
  const { data: role, isLoading: roleLoading } = useRoleById(id ?? '')
  const { data: allPermissions = [] } = useAllPermissions()

  // ─── Mutations ─────────────────────────────────────────────────────
  const createMutation = useCreateRole()
  const updateMutation = useUpdateRole()
  const isSaving = createMutation.isPending || updateMutation.isPending

  // ─── Main form ─────────────────────────────────────────────────────
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
      ? { name: '', description: '', permissionIds: [] }
      : { code: '', name: '', description: '', permissionIds: [] },
  })

  // ─── Populate form when role data loads ────────────────────────────
  useEffect(() => {
    if (isEdit && role) {
      reset({
        name: role.name,
        description: role.description ?? '',
        permissionIds: role.permissions.map((p) => p.id),
      })
    }
  }, [isEdit, role, reset])

  // ─── Tab change handler ────────────────────────────────────────────
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

  // ─── Permissions ───────────────────────────────────────────────────
  // Memoise the watched array so its reference is stable when the underlying
  // value is unchanged — otherwise `?? []` produces a fresh array each render
  // and invalidates every callback that depends on it.
  const watchedPermissionIds = watch('permissionIds') as string[] | undefined
  const selectedPermissionIds = useMemo(() => watchedPermissionIds ?? [], [watchedPermissionIds])

  const togglePermission = useCallback(
    (permissionId: string) => {
      const current = selectedPermissionIds
      const next = current.includes(permissionId)
        ? current.filter((pid) => pid !== permissionId)
        : [...current, permissionId]
      setValue('permissionIds', next, { shouldValidate: true })
    },
    [selectedPermissionIds, setValue],
  )

  const toggleCategory = useCallback(
    (categoryPermissions: PermissionItem[]) => {
      const categoryIds = categoryPermissions.map((p) => p.id)
      const allSelected = categoryIds.every((id) => selectedPermissionIds.includes(id))
      const current = selectedPermissionIds
      const next = allSelected
        ? current.filter((id) => !categoryIds.includes(id))
        : [...new Set([...current, ...categoryIds])]
      setValue('permissionIds', next, { shouldValidate: true })
    },
    [selectedPermissionIds, setValue],
  )

  // Group permissions by category (resource)
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, PermissionItem[]> = {}
    for (const perm of allPermissions) {
      const category = perm.resource || 'other'
      if (!groups[category]) groups[category] = []
      groups[category].push(perm)
    }
    // Sort categories alphabetically
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [allPermissions])

  // Filter permissions by search
  const filteredGroups = useMemo(() => {
    if (!permissionSearch) return groupedPermissions
    const search = permissionSearch.toLowerCase()
    return groupedPermissions
      .map(([category, perms]) => {
        const filtered = perms.filter(
          (p) =>
            p.code.toLowerCase().includes(search) ||
            p.name.toLowerCase().includes(search) ||
            category.toLowerCase().includes(search),
        )
        return [category, filtered] as [string, PermissionItem[]]
      })
      .filter(([, perms]) => perms.length > 0)
  }, [groupedPermissions, permissionSearch])

  // ─── Form submit ───────────────────────────────────────────────────
  const onSubmit = useCallback(
    (data: FormData) => {
      const clean = (val: unknown) =>
        typeof val === 'string' && val.trim() ? val.trim() : undefined

      if (isEdit && id) {
        const updateData = {
          name: data.name,
          description: clean(data.description),
          permissionIds: data.permissionIds,
        }
        updateMutation.mutate(
          { id, data: updateData },
          {
            onSuccess: () => navigate('/system/roles'),
            onError: (error) => {
              const message = extractApiErrorMessage(error, '')
              if (message.toLowerCase().includes('name')) {
                setError('name', { message: t('Invalid role name') })
                handleTabChange('general')
              }
            },
          },
        )
      } else {
        const createData = {
          code: (data as CreateFormData).code,
          name: data.name,
          description: clean(data.description),
          permissionIds: data.permissionIds,
        }
        createMutation.mutate(createData, {
          onSuccess: () => navigate('/system/roles'),
          onError: (error) => {
            const status = getErrorStatus(error)
            const message = extractApiErrorMessage(error, '')
            if (status === 409 || message.toLowerCase().includes('code')) {
              setError('code' as keyof FormData, { message: t('Role code already exists') })
              setActiveTab('general')
            }
          },
        })
      }
    },
    [isEdit, id, updateMutation, createMutation, navigate, setError, handleTabChange, t],
  )

  // ─── Tab-aware validation ──────────────────────────────────────────
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

  // ─── Loading state ─────────────────────────────────────────────────
  if (isEdit && roleLoading) {
    return <FormSkeleton />
  }

  if (isEdit && !role && !roleLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-[var(--text-primary)]">{t('Role not found')}</p>
          <button
            onClick={() => navigate('/system/roles')}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            {t('Back to roles')}
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
          onClick={() => navigate('/system/roles')}
          className="rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
          aria-label={t('Back')}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            {isEdit ? t('Edit role') : t('Create role')}
          </h1>
          {isEdit && role && (
            <span className="rounded-md bg-[var(--app-bg)] px-2.5 py-1 font-mono text-sm text-[var(--text-secondary)]">
              {role.code}
            </span>
          )}
        </div>
      </div>

      {/* ── Form wrapping tabs ── */}
      <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4 w-full justify-start">
            <TabsTrigger value="general" className="gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              {t('General')}
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-1.5">
              <KeyRound className="h-3.5 w-3.5" />
              {t('Permissions')}
              <span className="ml-1 text-xs text-[var(--text-secondary)]">
                ({selectedPermissionIds.length})
              </span>
            </TabsTrigger>
          </TabsList>

          {/* ════════════════════ GENERAL TAB ════════════════════ */}
          <TabsContent value="general" className="space-y-4">
            <FormSection title={t('Role details')} icon={<Shield className="h-4 w-4" />}>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                {/* Code (create only) */}
                {!isEdit && (
                  <div className="space-y-1.5">
                    <Label htmlFor="code">
                      {t('Code')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="code"
                      placeholder="CUSTOM_ROLE"
                      autoComplete="off"
                      className={errors.code ? 'border-red-400' : ''}
                      aria-invalid={!!errors.code}
                      aria-describedby={errors.code ? 'code-error' : undefined}
                      {...register('code' as keyof FormData)}
                    />
                    {errors.code && (
                      <p id="code-error" role="alert" className="text-xs text-red-500">
                        {errors.code.message ||
                          t('Code must be uppercase letters, digits, and underscores')}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="name">
                    {t('Name')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder={t('Role name')}
                    className={errors.name ? 'border-red-400' : ''}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    {...register('name')}
                  />
                  {errors.name && (
                    <p id="name-error" role="alert" className="text-xs text-red-500">
                      {t('Name must be 2-100 characters')}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="description">{t('Description')}</Label>
                  <Textarea
                    id="description"
                    placeholder={t('Optional description')}
                    rows={3}
                    className="resize-none"
                    {...register('description')}
                  />
                </div>
              </div>
            </FormSection>
          </TabsContent>

          {/* ════════════════════ PERMISSIONS TAB ════════════════════ */}
          <TabsContent value="permissions" className="space-y-4">
            <FormSection title={t('Permissions')} icon={<KeyRound className="h-4 w-4" />}>
              <div className="space-y-3">
                {/* Permission search */}
                <div className="relative">
                  <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <Input
                    value={permissionSearch}
                    onChange={(e) => setPermissionSearch(e.target.value)}
                    placeholder={t('Search permissions...')}
                    className="h-8 pl-8 text-sm"
                  />
                </div>

                <div className="max-h-[500px] space-y-3 overflow-y-auto rounded-md border border-[var(--border-color-pro)] bg-[var(--app-bg)] p-3">
                  {filteredGroups.map(([category, perms]) => {
                    const categoryIds = perms.map((p) => p.id)
                    const allSelected = categoryIds.every((id) =>
                      selectedPermissionIds.includes(id),
                    )
                    const someSelected =
                      !allSelected && categoryIds.some((id) => selectedPermissionIds.includes(id))

                    return (
                      <div key={category}>
                        {/* Category header with select all */}
                        <label className="mb-1.5 flex cursor-pointer items-center gap-2 px-2">
                          <Checkbox
                            checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                            onCheckedChange={() => toggleCategory(perms)}
                          />
                          <span className="text-[10px] font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
                            {category}
                          </span>
                          <span className="text-[10px] text-[var(--text-secondary)]">
                            ({categoryIds.filter((id) => selectedPermissionIds.includes(id)).length}
                            /{categoryIds.length})
                          </span>
                        </label>
                        {perms.map((perm) => {
                          const isChecked = selectedPermissionIds.includes(perm.id)
                          return (
                            // eslint-disable-next-line jsx-a11y/label-has-associated-control
                            <label
                              key={perm.id}
                              className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 transition-colors ${
                                isChecked ? 'bg-[var(--active-bg)]' : 'hover:bg-[var(--hover-bg)]'
                              }`}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => togglePermission(perm.id)}
                              />
                              <div className="min-w-0 flex-1">
                                <span className="text-sm text-[var(--text-primary)]">
                                  {perm.name}
                                </span>
                                <span className="ml-1.5 text-[10px] text-[var(--text-secondary)]">
                                  ({perm.code})
                                </span>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    )
                  })}
                  {filteredGroups.length === 0 && (
                    <p className="px-2 py-3 text-center text-sm text-[var(--text-secondary)]">
                      {permissionSearch ? t('No permissions found') : t('No permissions available')}
                    </p>
                  )}
                </div>
              </div>
            </FormSection>
          </TabsContent>
        </Tabs>

        {/* ── Sticky Footer ── */}
        <div className="sticky bottom-0 -mx-4 mt-6 flex items-center justify-end gap-3 border-t border-[var(--border-color-pro)] bg-[var(--card-bg)] px-6 py-4">
          <button
            type="button"
            onClick={() => navigate('/system/roles')}
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
