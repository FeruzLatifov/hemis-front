import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, Controller, type Control, type FieldPath } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  useUniversity,
  useUniversityDictionaries,
  useCreateUniversity,
  useUpdateUniversity,
} from '@/hooks/useUniversities'
import { universitiesApi, type Dictionary } from '@/api/universities.api'
import { ACTIVITY_STATUSES, STATUS_EVENT_MAP, NEEDS_SUCCESSOR } from './activity-statuses'
import {
  useUniversityDashboard,
  useSyncUniversityData,
  useAddLifecycleEvent,
} from '@/hooks/useUniversity'
import { FoundersSection, CadastreSection, LifecycleSection } from './UniversityDetailPage'
import { OfficialsTab } from './UniversityOfficialsTab'
import { ProfileTab } from './UniversityProfileTab'
import { FormSection, FormSkeleton } from './UniversityFormShared'
import { renderDictItems } from './form-helpers'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select'
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

/**
 * RHF-controlled wrapper around shadcn/Radix Select.
 *
 * Why Controller (not raw `value={watch(...)}`):
 * Radix Select binds its internal `value` lazily — when the form's `defaultValues`
 * start empty and dictionaries arrive after first paint, the un-controlled→controlled
 * transition can leave the trigger showing the placeholder even though RHF state holds
 * the right code. Controller subscribes the field at the React-tree level, so the
 * Select re-renders deterministically when the underlying value changes.
 *
 * Lives here (not in UniversityFormShared) because it is tightly typed against
 * the page's local FormData shape — pulling it out would require generics that
 * the form's narrow set of select fields doesn't benefit from.
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
      // Activity status is a hardcoded enum, not a classifier — resolve against it directly.
      activityStatusCode:
        university.activityStatusCode &&
        ACTIVITY_STATUSES.some((s) => s.code === university.activityStatusCode)
          ? university.activityStatusCode
          : '',
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
    queryKey: queryKeys.universities.terrains(selectedDistrict ?? ''),
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
            <TabsTrigger value="founders" className="gap-1.5">
              <Landmark className="h-4 w-4" />
              {t('Founders')}
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
                    items={ACTIVITY_STATUSES.map((s) => ({ code: s.code, name: t(s.labelKey) }))}
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

          <TabsContent value="founders" className="space-y-4">
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
