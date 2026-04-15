import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, Controller, type Control, type FieldPath } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import {
  useUniversity,
  useUniversityDictionaries,
  useCreateUniversity,
  useUpdateUniversity,
} from '@/hooks/useUniversities'
import { universitiesApi, type Dictionary } from '@/api/universities.api'
import { universityApi } from '@/api/university.api'
import {
  useUniversityDashboard,
  useSyncUniversityData,
  useAddLifecycleEvent,
  useUniversityOfficials,
  useAppointOfficial,
  useRemoveOfficial,
  useUniversityProfile,
  useUpdateUniversityProfile,
} from '@/hooks/useUniversity'
import {
  LegalSection,
  FoundersSection,
  CadastreSection,
  LifecycleSection,
} from './UniversityDetailPage'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Building2,
  MapPin,
  Globe,
  Settings,
  FileText,
  Landmark,
  RefreshCw,
  Users,
  History,
  Share2,
  Trash2,
  Plus,
} from 'lucide-react'

// Zod validation schema — matches backend constraints
const universitySchema = z.object({
  code: z.string().min(1).max(255).trim(),
  name: z.string().min(1).max(1024).trim(),
  tin: z.string().max(255).optional(),
  ownershipCode: z.string().optional(),
  universityTypeCode: z.string().optional(),
  regionCode: z.string().optional(),
  soatoRegion: z.string().optional(),
  address: z.string().optional(),
  cadastre: z.string().optional(),
  universityUrl: z.string().optional(),
  studentUrl: z.string().optional(),
  teacherUrl: z.string().optional(),
  uzbmbUrl: z.string().optional(),
  mailAddress: z.string().optional(),
  bankInfo: z.string().optional(),
  accreditationInfo: z.string().optional(),
  active: z.boolean(),
  gpaEdit: z.boolean(),
  accreditationEdit: z.boolean(),
  addStudent: z.boolean(),
  allowGrouping: z.boolean(),
  allowTransferOutside: z.boolean(),
  oneId: z.boolean(),
  gradingSystem: z.boolean(),
  addForeignStudent: z.boolean(),
  addTransferStudent: z.boolean(),
  addAcademicMobileStudent: z.boolean(),
  activityStatusCode: z.string().optional(),
  belongsToCode: z.string().optional(),
  contractCategoryCode: z.string().optional(),
  versionTypeCode: z.string().optional(),
  terrain: z.string().optional(),
  parentUniversity: z.string().optional(),
  // Lifecycle (shown when status changes)
  lifecycleSuccessorCode: z.string().optional(),
  lifecycleDecreeNumber: z.string().optional(),
  lifecycleDecreeDate: z.string().optional(),
  lifecycleNote: z.string().optional(),
})

type FormData = z.infer<typeof universitySchema>

const DEFAULT_VALUES: FormData = {
  code: '',
  name: '',
  tin: '',
  ownershipCode: '',
  universityTypeCode: '',
  regionCode: '',
  soatoRegion: '',
  address: '',
  cadastre: '',
  universityUrl: '',
  studentUrl: '',
  teacherUrl: '',
  uzbmbUrl: '',
  mailAddress: '',
  bankInfo: '',
  accreditationInfo: '',
  active: true,
  gpaEdit: false,
  accreditationEdit: true,
  addStudent: false,
  allowGrouping: false,
  allowTransferOutside: true,
  oneId: false,
  gradingSystem: false,
  addForeignStudent: false,
  addTransferStudent: false,
  addAcademicMobileStudent: false,
  activityStatusCode: '',
  belongsToCode: '',
  contractCategoryCode: '',
  versionTypeCode: '',
  terrain: '',
  parentUniversity: '',
  lifecycleSuccessorCode: '',
  lifecycleDecreeNumber: '',
  lifecycleDecreeDate: '',
  lifecycleNote: '',
}

// Status code → lifecycle event type (auto-mapped)
const STATUS_EVENT_MAP: Record<string, string> = {
  '10': 'REACTIVATED',
  '11': 'CLOSED',
  '12': 'MERGED',
  '13': 'LICENSE_REVOKED',
  '14': 'SUSPENDED',
  '15': 'REORGANIZED',
}

// Statuses that require successor university
const NEEDS_SUCCESSOR = new Set(['12', '15'])

/** Render SelectItem list from dictionary (DRY helper for classifier selects) */
function renderDictItems(items: Array<{ code: string; name: string }>) {
  return items.map((item) => (
    <SelectItem key={item.code} value={item.code}>
      {item.name}
    </SelectItem>
  ))
}

/**
 * RHF-controlled wrapper around shadcn/Radix Select.
 *
 * Why Controller (not raw `value={watch(...)}`):
 * Radix Select binds its internal `value` lazily — when the form's `defaultValues`
 * start empty and dictionaries arrive after first paint, the un-controlled→controlled
 * transition can leave the trigger showing the placeholder even though RHF state holds
 * the right code. Controller subscribes the field at the React-tree level, so the
 * Select re-renders deterministically when the underlying value changes.
 */
function FormSelect({
  name,
  control,
  items,
  placeholder,
  disabled,
}: {
  name: FieldPath<FormData>
  control: Control<FormData>
  items: Array<{ code: string; name: string }>
  placeholder: string
  disabled?: boolean
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const value = typeof field.value === 'string' && field.value ? field.value : undefined
        return (
          <Select value={value} onValueChange={field.onChange} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>{renderDictItems(items)}</SelectContent>
          </Select>
        )
      }}
    />
  )
}

/** Section card */
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

/** Form loading skeleton */
function FormSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <Skeleton className="h-8 w-48 rounded" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-[var(--border-color-pro)] bg-[var(--card-bg)] p-6"
        >
          <Skeleton className="mb-4 h-5 w-36 rounded" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="space-y-2">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-9 w-full rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Outer page = data gate + remount wrapper.
 *
 * Mounts the form ONLY after the university record and full dictionaries are loaded,
 * so the inner component can call `useForm({ defaultValues: initialValues })` with
 * resolved values already present on the first render. The `key` ensures a fresh
 * RHF instance per university — no stale Select state when navigating between rows.
 */
export default function UniversityFormPage() {
  const { code } = useParams<{ code: string }>()
  const isEdit = !!code
  const { data: university, isLoading: loadingUniversity } = useUniversity(code ?? '')
  const { data: dictionaries, isLoading: loadingDictionaries } = useUniversityDictionaries()
  if (
    (isEdit && (loadingUniversity || !university)) ||
    loadingDictionaries ||
    !dictionaries ||
    dictionaries.ownerships.length === 0
  ) {
    return <FormSkeleton />
  }
  return <UniversityFormPageInner key={code ?? 'new'} />
}

function UniversityFormPageInner() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isEdit = !!code

  const { data: university } = useUniversity(code ?? '')
  const {
    data: dictionaries = {
      regions: [],
      ownerships: [],
      types: [],
      activityStatuses: [],
      belongsToOptions: [],
      contractCategories: [],
      versionTypes: [],
      districts: [],
    },
  } = useUniversityDictionaries()
  const createMutation = useCreateUniversity()
  const updateMutation = useUpdateUniversity()
  const syncMutation = useSyncUniversityData(code ?? '')
  const addLifecycleMutation = useAddLifecycleEvent(code ?? '')
  const { data: extData } = useUniversityDashboard(code ?? '')

  const initialValues = useMemo<FormData>(() => {
    if (!isEdit || !university) return DEFAULT_VALUES
    // SOATO: longest-prefix match (legacy DB stores the most precise level in `_soato`).
    const resolveByPrefix = (raw: string | undefined, dict: Dictionary[]): string => {
      if (!raw) return ''
      if (dict.some((d) => d.code === raw)) return raw
      const sorted = [...dict].sort((a, b) => b.code.length - a.code.length)
      return sorted.find((d) => raw.startsWith(d.code))?.code ?? ''
    }
    // Classifiers: legacy CUBA rows sometimes store the display name instead of the code,
    // so reverse-lookup by name when an exact code match fails.
    const resolveByCodeOrName = (raw: string | undefined, dict: Dictionary[]): string => {
      if (!raw) return ''
      if (dict.some((d) => d.code === raw)) return raw
      return dict.find((d) => d.name === raw)?.code ?? ''
    }
    return {
      code: university.code,
      name: university.name,
      tin: university.tin || '',
      ownershipCode: resolveByCodeOrName(university.ownershipCode, dictionaries.ownerships),
      universityTypeCode: resolveByCodeOrName(university.universityTypeCode, dictionaries.types),
      regionCode: resolveByPrefix(university.regionCode, dictionaries.regions),
      soatoRegion: resolveByPrefix(university.soatoRegion, dictionaries.districts),
      address: university.address || '',
      cadastre: university.cadastre || '',
      universityUrl: university.universityUrl || '',
      studentUrl: university.studentUrl || '',
      teacherUrl: university.teacherUrl || '',
      uzbmbUrl: university.uzbmbUrl || '',
      mailAddress: university.mailAddress || '',
      bankInfo: university.bankInfo || '',
      accreditationInfo: university.accreditationInfo || '',
      active: university.active ?? true,
      gpaEdit: university.gpaEdit ?? false,
      accreditationEdit: university.accreditationEdit ?? true,
      addStudent: university.addStudent ?? false,
      allowGrouping: university.allowGrouping ?? false,
      allowTransferOutside: university.allowTransferOutside ?? true,
      oneId: university.oneId ?? false,
      gradingSystem: university.gradingSystem ?? false,
      addForeignStudent: university.addForeignStudent ?? false,
      addTransferStudent: university.addTransferStudent ?? false,
      addAcademicMobileStudent: university.addAcademicMobileStudent ?? false,
      activityStatusCode: resolveByCodeOrName(
        university.activityStatusCode,
        dictionaries.activityStatuses,
      ),
      belongsToCode: resolveByCodeOrName(university.belongsToCode, dictionaries.belongsToOptions),
      contractCategoryCode: resolveByCodeOrName(
        university.contractCategoryCode,
        dictionaries.contractCategories,
      ),
      versionTypeCode: resolveByCodeOrName(university.versionTypeCode, dictionaries.versionTypes),
      terrain: university.terrain || '',
      parentUniversity: university.parentUniversity || '',
      lifecycleSuccessorCode: '',
      lifecycleDecreeNumber: '',
      lifecycleDecreeDate: '',
      lifecycleNote: '',
    }
  }, [isEdit, university, dictionaries])

  // Outer page guarantees `university` + `dictionaries` are loaded before mounting
  // this inner component, so `initialValues` is fully resolved on first render.
  // Pass it as `defaultValues` — RHF (and Radix Select) initialise correctly without
  // needing a deferred reset.
  const form = useForm<FormData>({
    resolver: zodResolver(universitySchema),
    defaultValues: initialValues,
  })

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    register,
  } = form

  const selectedRegionCode = watch('regionCode')
  const selectedDistrict = watch('soatoRegion')

  // Terrain (neighborhoods) filtered by district SOATO
  const { data: terrains = [] } = useQuery({
    queryKey: ['terrains', selectedDistrict],
    queryFn: () => universitiesApi.getTerrains(selectedDistrict!),
    enabled: !!selectedDistrict,
  })

  // Filter districts by selected region (SOATO: region=4 digits, district=7 digits, same prefix)
  const filteredDistricts = useMemo(() => {
    if (!selectedRegionCode) return dictionaries.districts
    return dictionaries.districts.filter((d) => d.code.startsWith(selectedRegionCode))
  }, [selectedRegionCode, dictionaries.districts])

  // Clear district when region changes (if current district doesn't belong to new region)
  useEffect(() => {
    const currentDistrict = form.getValues('soatoRegion')
    if (currentDistrict && selectedRegionCode && !currentDistrict.startsWith(selectedRegionCode)) {
      setValue('soatoRegion', '')
    }
  }, [selectedRegionCode, setValue, form])

  // values prop (passed to useForm above) auto-syncs form state when university loads or changes after sync

  // Track original activity status to detect changes
  const originalStatus = university?.activityStatusCode || ''

  const onSubmit = (data: FormData) => {
    const statusChanged =
      isEdit && data.activityStatusCode && data.activityStatusCode !== originalStatus

    if (isEdit) {
      updateMutation.mutate(
        { code: code!, data },
        {
          onSuccess: () => {
            // If status changed → lifecycle event (auto-mapped from status code)
            if (statusChanged) {
              const eventType = STATUS_EVENT_MAP[data.activityStatusCode!] || 'CLOSED'
              addLifecycleMutation.mutate({
                eventType,
                eventDate: data.lifecycleDecreeDate || new Date().toISOString().split('T')[0],
                successorCode: data.lifecycleSuccessorCode || null,
                decreeNumber: data.lifecycleDecreeNumber || null,
                decreeDate: data.lifecycleDecreeDate || null,
                studentsCount: null,
                employeesCount: null,
                oldName: null,
                newName: null,
                note: data.lifecycleNote || null,
              })
            }
            navigate(`/institutions/universities/${code}`)
          },
        },
      )
    } else {
      createMutation.mutate(data, {
        onSuccess: () => navigate('/institutions/universities'),
      })
    }
  }

  const isSaving = isSubmitting || createMutation.isPending || updateMutation.isPending

  const [formTab, setFormTab] = useState('general')

  return (
    <div className="mx-auto max-w-4xl p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-color-pro)] bg-[var(--card-bg)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)]"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('Back')}
          </button>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">
            {isEdit ? (university?.name ?? '') : t('Add new HEI')}
          </h1>
        </div>
        {isEdit && (
          <button
            type="button"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-color-pro)] bg-[var(--card-bg)] px-3.5 py-1.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] disabled:opacity-50"
          >
            {syncMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {syncMutation.isPending ? t('Syncing...') : t('Sync external data')}
          </button>
        )}
      </div>

      <form key={university?.code ?? 'new'} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Tabs value={formTab} onValueChange={setFormTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="general" className="gap-1.5">
              <Building2 className="h-4 w-4" />
              {t('General')}
            </TabsTrigger>
            {isEdit && (
              <TabsTrigger value="profile" className="gap-1.5">
                <Share2 className="h-4 w-4" />
                {t('Profile')}
              </TabsTrigger>
            )}
            {isEdit && (
              <TabsTrigger value="officials" className="gap-1.5">
                <Users className="h-4 w-4" />
                {t('Officials')}
              </TabsTrigger>
            )}
            <TabsTrigger value="legal" className="gap-1.5">
              <Landmark className="h-4 w-4" />
              {t('Legal')}
            </TabsTrigger>
            <TabsTrigger value="organization" className="gap-1.5">
              <Settings className="h-4 w-4" />
              {t('Settings')}
            </TabsTrigger>
            <TabsTrigger value="property" className="gap-1.5">
              <MapPin className="h-4 w-4" />
              {t('Property')}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <History className="h-4 w-4" />
              {t('History')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            {/* Asosiy ma'lumotlar */}
            <FormSection title={t('Basic information')} icon={<Building2 className="h-4 w-4" />}>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="code">
                    {t('Code')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="code"
                    {...register('code')}
                    readOnly={isEdit}
                    placeholder="00001"
                    maxLength={255}
                    className={`${errors.code ? 'border-red-300 focus:border-red-400' : ''} ${isEdit ? 'cursor-not-allowed bg-[var(--table-row-alt)] text-[var(--text-secondary)]' : ''}`}
                  />
                  {errors.code && <p className="text-xs text-red-500">{t('Code is required')}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tin">{t('INN')}</Label>
                  <Input id="tin" {...register('tin')} placeholder="123456789" maxLength={255} />
                </div>
                <div className="col-span-full space-y-1.5">
                  <Label htmlFor="name">
                    {t('Name')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder={t('Full name of HEI')}
                    maxLength={1024}
                    className={errors.name ? 'border-red-300 focus:border-red-400' : ''}
                  />
                  {errors.name && <p className="text-xs text-red-500">{t('Name is required')}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>{t('Ownership')}</Label>
                  <FormSelect
                    name="ownershipCode"
                    control={form.control}
                    items={dictionaries.ownerships}
                    placeholder={t('Select')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('Type')}</Label>
                  <FormSelect
                    name="universityTypeCode"
                    control={form.control}
                    items={dictionaries.types}
                    placeholder={t('Select')}
                  />
                </div>
              </div>
            </FormSection>

            {/* Joylashuv */}
            <FormSection title={t('Location')} icon={<MapPin className="h-4 w-4" />}>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t('Region')}</Label>
                  <FormSelect
                    name="regionCode"
                    control={form.control}
                    items={dictionaries.regions}
                    placeholder={t('Select')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('District')}</Label>
                  <FormSelect
                    name="soatoRegion"
                    control={form.control}
                    items={filteredDistricts}
                    placeholder={t('Select')}
                  />
                </div>
                <div className="col-span-full space-y-1.5">
                  <Label htmlFor="address">{t('Address')}</Label>
                  <Textarea
                    id="address"
                    {...register('address')}
                    placeholder={t('Full address')}
                    rows={2}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mailAddress">{t('Mail address')}</Label>
                  <Input
                    id="mailAddress"
                    {...register('mailAddress')}
                    placeholder={t('Mail address')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cadastre">{t('Cadastre')}</Label>
                  <Input id="cadastre" {...register('cadastre')} placeholder={t('Cadastre')} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('Neighborhood')}</Label>
                  <FormSelect
                    name="terrain"
                    control={form.control}
                    items={terrains}
                    placeholder={selectedDistrict ? t('Select') : t('Select district first')}
                    disabled={!selectedDistrict}
                  />
                </div>
              </div>
            </FormSection>

            {/* HEMIS portallari — universitet kirish manzillari */}
            <FormSection title={t('URLs')} icon={<Globe className="h-4 w-4" />}>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="universityUrl">{t('University site')}</Label>
                  <Input
                    id="universityUrl"
                    {...register('universityUrl')}
                    placeholder="https://hemis.university.uz"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="studentUrl">{t('Students')}</Label>
                  <Input
                    id="studentUrl"
                    {...register('studentUrl')}
                    placeholder="https://student.university.uz"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="teacherUrl">{t('Teachers')}</Label>
                  <Input
                    id="teacherUrl"
                    {...register('teacherUrl')}
                    placeholder="https://teacher.university.uz"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="uzbmbUrl">{t('UZBMB')}</Label>
                  <Input
                    id="uzbmbUrl"
                    {...register('uzbmbUrl')}
                    placeholder="https://uzbmb.university.uz"
                  />
                </div>
              </div>
            </FormSection>
          </TabsContent>

          <TabsContent value="organization" className="space-y-4">
            {/* HEMIS konfiguratsiyasi */}
            <FormSection title={t('HEMIS configuration')} icon={<Landmark className="h-4 w-4" />}>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t('HEMIS version')}</Label>
                  <FormSelect
                    name="versionTypeCode"
                    control={form.control}
                    items={dictionaries.versionTypes}
                    placeholder={t('Select')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('Belongs to')}</Label>
                  <FormSelect
                    name="belongsToCode"
                    control={form.control}
                    items={dictionaries.belongsToOptions}
                    placeholder={t('Select')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('Activity status')}</Label>
                  <FormSelect
                    name="activityStatusCode"
                    control={form.control}
                    items={dictionaries.activityStatuses}
                    placeholder={t('Select')}
                  />
                </div>

                {/* Lifecycle fields — auto-shown when activity status CHANGED */}
                {isEdit &&
                  watch('activityStatusCode') &&
                  watch('activityStatusCode') !== originalStatus &&
                  (() => {
                    const newStatus = watch('activityStatusCode')!
                    const showSuccessor = NEEDS_SUCCESSOR.has(newStatus)

                    return (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 md:col-span-2 dark:border-amber-900/30 dark:bg-amber-950/10">
                        <p className="mb-3 text-sm font-medium text-amber-700 dark:text-amber-400">
                          {t('Status is being changed. Please provide details:')}
                        </p>
                        <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label htmlFor="lifecycleDecreeDate">{t('Effective date')}</Label>
                            <Input
                              id="lifecycleDecreeDate"
                              type="date"
                              {...register('lifecycleDecreeDate')}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="lifecycleDecreeNumber">{t('Decree number')}</Label>
                            <Input
                              id="lifecycleDecreeNumber"
                              {...register('lifecycleDecreeNumber')}
                              placeholder="PQ-123"
                            />
                          </div>
                          {showSuccessor && (
                            <div className="space-y-1.5">
                              <Label htmlFor="lifecycleSuccessorCode">
                                {t('Successor university code')} *
                              </Label>
                              <Input
                                id="lifecycleSuccessorCode"
                                {...register('lifecycleSuccessorCode')}
                                placeholder={t('e.g. 301')}
                              />
                            </div>
                          )}
                          <div className="space-y-1.5">
                            <Label htmlFor="lifecycleNote">{t('Note')}</Label>
                            <Input
                              id="lifecycleNote"
                              {...register('lifecycleNote')}
                              placeholder={t('Additional details')}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                <div className="space-y-1.5">
                  <Label>{t('Contract category')}</Label>
                  <FormSelect
                    name="contractCategoryCode"
                    control={form.control}
                    items={dictionaries.contractCategories}
                    placeholder={t('Select')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="parentUniversity">{t('Main university')}</Label>
                  <Input
                    id="parentUniversity"
                    {...register('parentUniversity')}
                    placeholder={t('Main university')}
                  />
                </div>
              </div>
            </FormSection>

            {/* Feature flags */}
            <FormSection title={t('Feature flags')} icon={<Settings className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {(
                  [
                    { key: 'active' as const, label: t('Active') },
                    { key: 'gpaEdit' as const, label: t('GPA edit') },
                    { key: 'accreditationEdit' as const, label: t('Accreditation edit') },
                    { key: 'addStudent' as const, label: t('Add student') },
                    { key: 'allowGrouping' as const, label: t('Allow grouping') },
                    { key: 'allowTransferOutside' as const, label: t('Allow transfer outside') },
                    { key: 'oneId' as const, label: t('OneID login') },
                    { key: 'gradingSystem' as const, label: t('Grading system') },
                    { key: 'addForeignStudent' as const, label: t('Add foreign student') },
                    { key: 'addTransferStudent' as const, label: t('Add transfer student') },
                    {
                      key: 'addAcademicMobileStudent' as const,
                      label: t('Add academic mobile student'),
                    },
                  ] as const
                ).map((setting) => (
                  <div
                    key={setting.key}
                    className="flex items-center gap-3 rounded-lg border border-[var(--border-color-pro)] bg-[var(--table-row-alt)] p-3 transition-colors hover:bg-[var(--hover-bg)]"
                  >
                    <Checkbox
                      id={setting.key}
                      checked={watch(setting.key)}
                      onCheckedChange={(checked) => setValue(setting.key, !!checked)}
                    />
                    <Label
                      htmlFor={setting.key}
                      className="cursor-pointer text-sm font-medium text-[var(--text-primary)]"
                    >
                      {setting.label}
                    </Label>
                  </div>
                ))}
              </div>
            </FormSection>

            {/* Qo'shimcha */}
            <FormSection title={t('Additional info')} icon={<FileText className="h-4 w-4" />}>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="bankInfo">{t('Bank info')}</Label>
                  <Textarea
                    id="bankInfo"
                    {...register('bankInfo')}
                    placeholder={t('Bank details')}
                    rows={3}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="accreditationInfo">{t('Accreditation info')}</Label>
                  <Textarea
                    id="accreditationInfo"
                    {...register('accreditationInfo')}
                    placeholder={t('Accreditation details')}
                    rows={3}
                  />
                </div>
              </div>
            </FormSection>
          </TabsContent>

          <TabsContent value="legal" className="space-y-4">
            <LegalSection legal={extData?.legal ?? null} t={t} />
            <FoundersSection founders={extData?.founders ?? []} t={t} />
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            {isEdit && <ProfileTab code={code!} t={t} />}
          </TabsContent>

          <TabsContent value="officials" className="space-y-4">
            <OfficialsTab code={code!} t={t} />
          </TabsContent>

          <TabsContent value="property" className="space-y-4">
            <CadastreSection cadastre={extData?.cadastre ?? []} t={t} />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <LifecycleSection lifecycle={extData?.lifecycle ?? []} t={t} />
          </TabsContent>
        </Tabs>

        {/* Sticky Footer — editable tablarda ko'rinadi (general, organization). Legal/Officials/Property/History — read-only yoki inline action */}
        {(!isEdit || formTab === 'general' || formTab === 'organization') && (
          <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t border-[var(--border-color-pro)] bg-[var(--card-bg)] px-6 py-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
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
        )}
      </form>
    </div>
  )
}

// ═══════════ Officials Tab ═══════════

function OfficialsTab({ code, t }: { code: string; t: (key: string) => string }) {
  const [view, setView] = useState<'current' | 'history'>('current')
  const { data: allOfficials = [] } = useUniversityOfficials(code, view === 'history')
  // Current tab: faqat joriy. History tab: faqat sobiq.
  const officials =
    view === 'current'
      ? allOfficials.filter((o) => o.current)
      : allOfficials.filter((o) => !o.current)
  const { data: positions = [] } = useQuery({
    queryKey: ['positions'],
    queryFn: () => universityApi.getPositions(),
    staleTime: 1000 * 60 * 60,
  })
  const appointMutation = useAppointOfficial(code)
  const removeMutation = useRemoveOfficial(code)
  const [showForm, setShowForm] = useState(false)
  const [pinfl, setPinfl] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [phone, setPhone] = useState('')
  const [document, setDocument] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [positionCode, setPositionCode] = useState('')
  const [decreeNumber, setDecreeNumber] = useState('')
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>(
    'idle',
  )
  const [dismissId, setDismissId] = useState<string | null>(null)
  const [dismissDecree, setDismissDecree] = useState('')

  const resetForm = () => {
    setPinfl('')
    setFirstName('')
    setLastName('')
    setMiddleName('')
    setPhone('')
    setDocument('')
    setBirthDate('')
    setPositionCode('')
    setDecreeNumber('')
    setLookupStatus('idle')
  }

  // PINFL kiritilganda — avval lokal bazadan qidiradi (document kerak emas)
  // Topilmasa — document yoki birthDate bilan tashqi API dan qidiradi
  useEffect(() => {
    if (pinfl.length === 14 && lookupStatus === 'idle') {
      setLookupStatus('loading')
      universityApi
        .lookupPerson(pinfl)
        .then((person) => {
          if (person) {
            if (person.firstName) setFirstName(String(person.firstName))
            if (person.lastName) setLastName(String(person.lastName))
            if (person.middleName) setMiddleName(String(person.middleName))
            if (person.phone) setPhone(String(person.phone))
            setLookupStatus('found')
          } else {
            setLookupStatus('not_found')
          }
        })
        .catch(() => setLookupStatus('not_found'))
    }
    if (pinfl.length < 14) setLookupStatus('idle')
  }, [pinfl, lookupStatus])

  // Tashqi API qidirish (document yoki birthDate bilan)
  const handleExternalLookup = () => {
    if (pinfl.length !== 14 || (!document && !birthDate)) return
    setLookupStatus('loading')
    universityApi
      .lookupPerson(pinfl, document || undefined, birthDate || undefined)
      .then((person) => {
        if (person) {
          if (person.firstName) setFirstName(String(person.firstName))
          if (person.lastName) setLastName(String(person.lastName))
          if (person.middleName) setMiddleName(String(person.middleName))
          if (person.phone) setPhone(String(person.phone))
          setLookupStatus('found')
        } else {
          setLookupStatus('not_found')
        }
      })
      .catch(() => setLookupStatus('not_found'))
  }

  const handleAppoint = () => {
    if (!pinfl || !firstName || !lastName || !positionCode) return
    appointMutation.mutate(
      {
        pinfl,
        firstName,
        lastName,
        middleName: middleName || undefined,
        phone: phone || undefined,
        positionCode,
        decreeNumber: decreeNumber || undefined,
      },
      {
        onSuccess: () => {
          resetForm()
          setShowForm(false)
        },
      },
    )
  }

  return (
    <FormSection title={t('Officials')} icon={<Users className="h-4 w-4" />}>
      <div className="mb-3 flex w-fit gap-1 rounded-lg border border-[var(--border-color-pro)] p-0.5">
        <button
          type="button"
          onClick={() => setView('current')}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${view === 'current' ? 'bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >
          {t('Current')} ({allOfficials.filter((o) => o.current).length})
        </button>
        <button
          type="button"
          onClick={() => setView('history')}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${view === 'history' ? 'bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >
          {t('History')}
        </button>
      </div>
      {officials.length > 0 && (
        <div className="mb-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color-pro)] text-left text-xs text-[var(--text-secondary)]">
                <th className="py-2 pr-3">{t('Position')}</th>
                <th className="py-2 pr-3">{t('Full name')}</th>
                <th className="py-2 pr-3">{t('PINFL')}</th>
                <th className="py-2 pr-3">{t('Phone')}</th>
                <th className="py-2 pr-3">{t('Decree')}</th>
                <th className="py-2 pr-3">{t('Period')}</th>
                <th className="w-16 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {officials.map((o) => (
                <tr
                  key={o.metaId}
                  className={`border-b border-[var(--border-color-pro)] last:border-b-0 ${!o.current ? 'opacity-50' : ''}`}
                >
                  <td className="py-2.5 pr-3 font-medium">{o.positionName || o.positionCode}</td>
                  <td className="py-2.5 pr-3">
                    {o.lastName} {o.firstName} {o.middleName ?? ''}
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-xs">{o.pinfl}</td>
                  <td className="py-2.5 pr-3">{o.phone || '\u2014'}</td>
                  <td className="py-2.5 pr-3 text-xs">{o.decreeNumber || '\u2014'}</td>
                  <td className="py-2.5 pr-3 text-xs">
                    {o.current ? (
                      <span className="text-emerald-600">{o.startDate || ''}</span>
                    ) : (
                      <span className="text-[var(--text-secondary)]">
                        {o.startDate || ''} — {o.endDate || ''}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5">
                    {o.current && dismissId !== o.metaId && (
                      <button
                        type="button"
                        onClick={() => setDismissId(o.metaId)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        {t('Dismiss')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Dismiss confirmation */}
      {dismissId && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-950/10">
          <p className="mb-2 text-sm font-medium text-red-700 dark:text-red-400">
            {t('Dismissal confirmation')}
          </p>
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">{t('Decree number')}</Label>
              <Input
                value={dismissDecree}
                onChange={(e) => setDismissDecree(e.target.value)}
                placeholder="PQ-789"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                removeMutation.mutate(
                  { metaId: dismissId, decree: dismissDecree || undefined },
                  {
                    onSuccess: () => {
                      setDismissId(null)
                      setDismissDecree('')
                    },
                  },
                )
              }}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
            >
              {t('Confirm dismissal')}
            </button>
            <button
              type="button"
              onClick={() => {
                setDismissId(null)
                setDismissDecree('')
              }}
              className="rounded-lg border border-[var(--border-color-pro)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
            >
              {t('Cancel')}
            </button>
          </div>
        </div>
      )}

      {view === 'current' &&
        (!showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 dark:border-blue-900/30 dark:bg-blue-950/20"
          >
            + {t('Appoint official')}
          </button>
        ) : (
          <div className="space-y-3 rounded-lg border border-[var(--border-color-pro)] bg-[var(--app-bg)] p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label>{t('PINFL')} *</Label>
                <Input
                  value={pinfl}
                  onChange={(e) => setPinfl(e.target.value.replace(/\D/g, ''))}
                  placeholder="14 raqam"
                  maxLength={14}
                />
                {lookupStatus === 'loading' && (
                  <p className="text-xs text-blue-500">{t('Searching...')}</p>
                )}
                {lookupStatus === 'found' && (
                  <p className="text-xs text-emerald-600">{t('Person found')}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>{t('Document')}</Label>
                <Input
                  value={document}
                  onChange={(e) => setDocument(e.target.value.toUpperCase())}
                  placeholder="AA1234567"
                  maxLength={9}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Birth date')}</Label>
                <Input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
            </div>
            {lookupStatus === 'not_found' && (document || birthDate) && (
              <button
                type="button"
                onClick={handleExternalLookup}
                className="text-sm text-blue-600 hover:underline"
              >
                {t('Search in external database')}
              </button>
            )}
            {lookupStatus === 'not_found' && !document && !birthDate && (
              <p className="text-xs text-amber-600">
                {t(
                  'Person not found locally. Enter document or birth date to search external database.',
                )}
              </p>
            )}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label>{t('Last name')} *</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t('First name')} *</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t('Middle name')}</Label>
                <Input value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label>{t('Position')} *</Label>
                <Select value={positionCode || undefined} onValueChange={setPositionCode}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select')} />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((p) => (
                      <SelectItem key={p.code} value={p.code}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t('Decree number')}</Label>
                <Input
                  value={decreeNumber}
                  onChange={(e) => setDecreeNumber(e.target.value)}
                  placeholder="PQ-456"
                />
              </div>
              <div className="space-y-1">
                <Label>{t('Phone')}</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998..."
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAppoint}
                disabled={
                  !pinfl || !firstName || !lastName || !positionCode || appointMutation.isPending
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-900/30 dark:bg-blue-950/20"
              >
                {appointMutation.isPending ? t('Saving...') : t('Appoint')}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm()
                  setShowForm(false)
                }}
                className="rounded-lg border border-[var(--border-color-pro)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
              >
                {t('Cancel')}
              </button>
            </div>
          </div>
        ))}
    </FormSection>
  )
}

// ═══════════ Profile Tab (contacts, social links, documents) ═══════════

// Brand names (Telegram, Instagram, ...) are proper nouns — identical in all locales.
// Only 'Website' is a translatable generic term; the rest fall through t() harmlessly.
const SOCIAL_PLATFORMS = [
  { key: 'website', labelKey: 'Website', placeholder: 'https://university.uz' },
  { key: 'telegram', labelKey: 'Telegram', placeholder: 'https://t.me/university' },
  { key: 'instagram', labelKey: 'Instagram', placeholder: 'https://instagram.com/university' },
  { key: 'youtube', labelKey: 'YouTube', placeholder: 'https://youtube.com/@university' },
  { key: 'facebook', labelKey: 'Facebook', placeholder: 'https://facebook.com/university' },
  { key: 'twitter', labelKey: 'Twitter', placeholder: 'https://twitter.com/university' },
  { key: 'linkedin', labelKey: 'LinkedIn', placeholder: 'https://linkedin.com/company/university' },
] as const

const DOCUMENT_TYPES = ['LICENSE', 'ACCREDITATION', 'CHARTER', 'OTHER'] as const

type DocRow = {
  type: string
  name: string
  fileKey?: string | null
  validFrom?: string | null
  validTo?: string | null
}

function ProfileTab({ code, t }: { code: string; t: (key: string) => string }) {
  const { data: profile } = useUniversityProfile(code)
  const updateMutation = useUpdateUniversityProfile(code)

  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [description, setDescription] = useState('')
  const [social, setSocial] = useState<Record<string, string>>({})
  const [docs, setDocs] = useState<DocRow[]>([])
  const [mapUrl, setMapUrl] = useState('')
  const [latitude, setLatitude] = useState<string>('')
  const [longitude, setLongitude] = useState<string>('')

  const fillFromProfile = (p: typeof profile) => {
    if (!p) return
    setPhone(p.phone ?? '')
    setEmail(p.email ?? '')
    setDescription(p.description ?? '')
    setSocial({
      website: p.socialLinks?.website ?? '',
      telegram: p.socialLinks?.telegram ?? '',
      instagram: p.socialLinks?.instagram ?? '',
      youtube: p.socialLinks?.youtube ?? '',
      facebook: p.socialLinks?.facebook ?? '',
      twitter: p.socialLinks?.twitter ?? '',
      linkedin: p.socialLinks?.linkedin ?? '',
    })
    setDocs(
      (p.documents ?? []).map((d) => ({
        type: d.type,
        name: d.name,
        fileKey: d.fileKey ?? null,
        validFrom: d.validFrom ?? null,
        validTo: d.validTo ?? null,
      })),
    )
    setMapUrl(p.mapUrl ?? '')
    setLatitude(p.latitude != null ? String(p.latitude) : '')
    setLongitude(p.longitude != null ? String(p.longitude) : '')
  }

  useEffect(() => {
    fillFromProfile(profile)
  }, [profile])

  // Extract coordinates from Google/Yandex Maps URL
  const extractCoords = () => {
    if (!mapUrl) return
    // Google: /@41.3123,69.2435,15z OR ?q=41.3123,69.2435 OR !3d41.3!4d69.2
    const googleAt = mapUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    const googleQ = mapUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
    const googleBang = mapUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
    // Yandex: ?ll=69.24%2C41.31 (lng,lat — reversed!)
    const yandexLl = mapUrl.match(/[?&]ll=(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/)
    // OSM / geo: URI  —  geo:41.31,69.24
    const geoUri = mapUrl.match(/^geo:(-?\d+\.\d+),(-?\d+\.\d+)/)

    let lat: string | null = null
    let lng: string | null = null
    if (googleAt) {
      lat = googleAt[1]
      lng = googleAt[2]
    } else if (googleQ) {
      lat = googleQ[1]
      lng = googleQ[2]
    } else if (googleBang) {
      lat = googleBang[1]
      lng = googleBang[2]
    } else if (yandexLl) {
      lng = yandexLl[1]
      lat = yandexLl[2]
    } else if (geoUri) {
      lat = geoUri[1]
      lng = geoUri[2]
    }

    if (lat && lng) {
      setLatitude(lat)
      setLongitude(lng)
    }
  }

  const addDoc = () => setDocs((prev) => [...prev, { type: 'LICENSE', name: '' }])
  const updateDoc = (idx: number, patch: Partial<DocRow>) =>
    setDocs((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)))
  const removeDoc = (idx: number) => setDocs((prev) => prev.filter((_, i) => i !== idx))

  const handleSave = () => {
    const socialLinks = Object.fromEntries(
      Object.entries(social).filter(([, v]) => v && v.trim() !== ''),
    )
    const lat = latitude.trim() ? Number(latitude) : null
    const lng = longitude.trim() ? Number(longitude) : null
    updateMutation.mutate({
      phone: phone || null,
      email: email || null,
      description: description || null,
      logoKey: profile?.logoKey ?? null,
      socialLinks: Object.keys(socialLinks).length ? socialLinks : null,
      documents: docs.filter((d) => d.name.trim() !== ''),
      mapUrl: mapUrl || null,
      latitude: Number.isFinite(lat as number) ? lat : null,
      longitude: Number.isFinite(lng as number) ? lng : null,
    })
  }

  const handleReset = () => fillFromProfile(profile)

  return (
    <>
      <FormSection title={t('Contacts')} icon={<Users className="h-4 w-4" />}>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="profile-phone">{t('Phone')}</Label>
            <Input
              id="profile-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998 XX XXX XX XX"
              maxLength={50}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-email">{t('Email')}</Label>
            <Input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@university.uz"
              maxLength={255}
            />
          </div>
          <div className="col-span-full space-y-1.5">
            <Label htmlFor="profile-description">{t('Description')}</Label>
            <Textarea
              id="profile-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('Short description of the university')}
              rows={3}
            />
          </div>
        </div>
      </FormSection>

      <FormSection title={t('Social links')} icon={<Share2 className="h-4 w-4" />}>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
          {SOCIAL_PLATFORMS.map((p) => (
            <div key={p.key} className="space-y-1.5">
              <Label htmlFor={`social-${p.key}`}>{t(p.labelKey)}</Label>
              <Input
                id={`social-${p.key}`}
                value={social[p.key] ?? ''}
                onChange={(e) => setSocial((s) => ({ ...s, [p.key]: e.target.value }))}
                placeholder={p.placeholder}
              />
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection title={t('Map location')} icon={<MapPin className="h-4 w-4" />}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="mapUrl">{t('Map URL')}</Label>
            <div className="flex gap-2">
              <Input
                id="mapUrl"
                value={mapUrl}
                onChange={(e) => setMapUrl(e.target.value)}
                placeholder="https://maps.google.com/... | https://yandex.uz/maps/..."
              />
              <button
                type="button"
                onClick={extractCoords}
                disabled={!mapUrl}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium whitespace-nowrap text-blue-600 transition-colors hover:bg-blue-100 disabled:opacity-50 dark:border-blue-900/30 dark:bg-blue-950/20"
              >
                {t('Extract from URL')}
              </button>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {t('Paste Google Maps or Yandex Maps link')}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="latitude">{t('Latitude')}</Label>
              <Input
                id="latitude"
                type="number"
                step="0.0000001"
                min="-90"
                max="90"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="41.3123456"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="longitude">{t('Longitude')}</Label>
              <Input
                id="longitude"
                type="number"
                step="0.0000001"
                min="-180"
                max="180"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="69.2453456"
              />
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title={t('Documents')} icon={<FileText className="h-4 w-4" />}>
        <div className="space-y-3">
          {docs.length === 0 && (
            <p className="text-sm text-[var(--text-secondary)]">{t('No documents yet')}</p>
          )}
          {docs.map((doc, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-[var(--border-color-pro)] bg-[var(--table-row-alt)] p-3"
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                <div className="space-y-1 md:col-span-3">
                  <Label className="text-xs">{t('Type')}</Label>
                  <Select value={doc.type} onValueChange={(v) => updateDoc(idx, { type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((dt) => (
                        <SelectItem key={dt} value={dt}>
                          {t(dt)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 md:col-span-5">
                  <Label className="text-xs">{t('Name')}</Label>
                  <Input
                    value={doc.name}
                    onChange={(e) => updateDoc(idx, { name: e.target.value })}
                    placeholder={t('Document title')}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs">{t('Valid from')}</Label>
                  <Input
                    type="date"
                    value={doc.validFrom ?? ''}
                    onChange={(e) => updateDoc(idx, { validFrom: e.target.value || null })}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs">{t('Valid to')}</Label>
                  <Input
                    type="date"
                    value={doc.validTo ?? ''}
                    onChange={(e) => updateDoc(idx, { validTo: e.target.value || null })}
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeDoc(idx)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/30 dark:bg-red-950/20"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('Remove')}
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addDoc}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 dark:border-blue-900/30 dark:bg-blue-950/20"
          >
            <Plus className="h-4 w-4" />
            {t('Add document')}
          </button>
        </div>
      </FormSection>

      <div className="flex items-center justify-end gap-3 rounded-xl border border-[var(--border-color-pro)] bg-[var(--card-bg)] px-6 py-4">
        <button
          type="button"
          onClick={handleReset}
          disabled={updateMutation.isPending}
          className="rounded-lg border border-[var(--border-color-pro)] bg-[var(--card-bg)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] disabled:opacity-50"
        >
          {t('Reset')}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 disabled:opacity-50 dark:border-blue-900/30 dark:bg-blue-950/20"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('Saving...')}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {t('Save profile')}
            </>
          )}
        </button>
      </div>
    </>
  )
}
