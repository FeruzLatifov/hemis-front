import { useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  useUniversity,
  useUniversityDictionaries,
  useCreateUniversity,
  useUpdateUniversity,
} from '@/hooks/useUniversities'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
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
  activityStatusCode: z.string().optional(),
  belongsToCode: z.string().optional(),
  contractCategoryCode: z.string().optional(),
  versionTypeCode: z.string().optional(),
  terrain: z.string().optional(),
  parentUniversity: z.string().optional(),
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
  activityStatusCode: '',
  belongsToCode: '',
  contractCategoryCode: '',
  versionTypeCode: '',
  terrain: '',
  parentUniversity: '',
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
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-5 flex items-center gap-2">
        <span className="text-gray-400">{icon}</span>
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
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
        <div key={i} className="rounded-xl border border-gray-200 bg-white p-6">
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

export default function UniversityFormPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isEdit = !!code

  const { data: university, isLoading: loadingUniversity } = useUniversity(code ?? '')
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

  const form = useForm<FormData>({
    resolver: zodResolver(universitySchema),
    defaultValues: DEFAULT_VALUES,
  })

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    register,
  } = form

  const selectedRegionCode = watch('regionCode')

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

  // Populate form when editing
  useEffect(() => {
    if (isEdit && university) {
      reset({
        code: university.code,
        name: university.name,
        tin: university.tin || '',
        ownershipCode: university.ownershipCode || '',
        universityTypeCode: university.universityTypeCode || '',
        regionCode: university.regionCode || '',
        soatoRegion: university.soatoRegion || '',
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
        activityStatusCode: university.activityStatusCode || '',
        belongsToCode: university.belongsToCode || '',
        contractCategoryCode: university.contractCategoryCode || '',
        versionTypeCode: university.versionTypeCode || '',
        terrain: university.terrain || '',
        parentUniversity: university.parentUniversity || '',
      })
    }
  }, [isEdit, university, reset])

  const onSubmit = (data: FormData) => {
    if (isEdit) {
      updateMutation.mutate(
        { code: code!, data },
        { onSuccess: () => navigate(`/institutions/universities/${code}`) },
      )
    } else {
      createMutation.mutate(data, {
        onSuccess: () => navigate('/institutions/universities'),
      })
    }
  }

  const isSaving = isSubmitting || createMutation.isPending || updateMutation.isPending

  if (isEdit && loadingUniversity) return <FormSkeleton />

  return (
    <div className="mx-auto max-w-4xl p-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('Back')}
        </button>
        <h1 className="text-lg font-semibold text-gray-900">
          {isEdit ? t('Edit HEI') : t('Add new HEI')}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                disabled={isEdit}
                placeholder="00001"
                maxLength={255}
                className={errors.code ? 'border-red-300 focus:border-red-400' : ''}
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
              <Select
                value={watch('ownershipCode') || undefined}
                onValueChange={(v) => setValue('ownershipCode', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Select')} />
                </SelectTrigger>
                <SelectContent>
                  {dictionaries.ownerships.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('Type')}</Label>
              <Select
                value={watch('universityTypeCode') || undefined}
                onValueChange={(v) => setValue('universityTypeCode', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Select')} />
                </SelectTrigger>
                <SelectContent>
                  {dictionaries.types.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </FormSection>

        {/* Joylashuv */}
        <FormSection title={t('Location')} icon={<MapPin className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t('Region')}</Label>
              <Select
                value={watch('regionCode') || undefined}
                onValueChange={(v) => setValue('regionCode', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Select')} />
                </SelectTrigger>
                <SelectContent>
                  {dictionaries.regions.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('District')}</Label>
              <Select
                value={watch('soatoRegion') || undefined}
                onValueChange={(v) => setValue('soatoRegion', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Select')} />
                </SelectTrigger>
                <SelectContent>
                  {filteredDistricts.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label htmlFor="terrain">{t('Neighborhood')}</Label>
              <Input id="terrain" {...register('terrain')} placeholder={t('Neighborhood')} />
            </div>
          </div>
        </FormSection>

        {/* Tashkilot */}
        <FormSection title={t('Organization')} icon={<Landmark className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t('HEMIS version')}</Label>
              <Select
                value={watch('versionTypeCode') || undefined}
                onValueChange={(v) => setValue('versionTypeCode', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Select')} />
                </SelectTrigger>
                <SelectContent>
                  {dictionaries.versionTypes.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('Belongs to')}</Label>
              <Select
                value={watch('belongsToCode') || undefined}
                onValueChange={(v) => setValue('belongsToCode', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Select')} />
                </SelectTrigger>
                <SelectContent>
                  {dictionaries.belongsToOptions.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('Activity status')}</Label>
              <Select
                value={watch('activityStatusCode') || undefined}
                onValueChange={(v) => setValue('activityStatusCode', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Select')} />
                </SelectTrigger>
                <SelectContent>
                  {dictionaries.activityStatuses.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('Contract category')}</Label>
              <Select
                value={watch('contractCategoryCode') || undefined}
                onValueChange={(v) => setValue('contractCategoryCode', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Select')} />
                </SelectTrigger>
                <SelectContent>
                  {dictionaries.contractCategories.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

        {/* Veb-saytlar */}
        <FormSection title={t('Websites')} icon={<Globe className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="universityUrl">{t('University URL')}</Label>
              <Input
                id="universityUrl"
                {...register('universityUrl')}
                placeholder="https://university.uz"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="studentUrl">{t('Students portal')}</Label>
              <Input
                id="studentUrl"
                {...register('studentUrl')}
                placeholder="https://student.university.uz"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="teacherUrl">{t('Teachers portal')}</Label>
              <Input
                id="teacherUrl"
                {...register('teacherUrl')}
                placeholder="https://teacher.university.uz"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="uzbmbUrl">{t('UZBMB URL')}</Label>
              <Input
                id="uzbmbUrl"
                {...register('uzbmbUrl')}
                placeholder="https://uzbmb.university.uz"
              />
            </div>
          </div>
        </FormSection>

        {/* Sozlamalar */}
        <FormSection title={t('Settings')} icon={<Settings className="h-4 w-4" />}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {(
              [
                { key: 'active' as const, label: t('Active') },
                { key: 'gpaEdit' as const, label: t('GPA edit') },
                { key: 'accreditationEdit' as const, label: t('Accreditation edit') },
                { key: 'addStudent' as const, label: t('Add student') },
                { key: 'allowGrouping' as const, label: t('Allow grouping') },
                { key: 'allowTransferOutside' as const, label: t('Allow transfer outside') },
              ] as const
            ).map((setting) => (
              <div
                key={setting.key}
                className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3 transition-colors hover:bg-gray-50"
              >
                <Checkbox
                  id={setting.key}
                  checked={watch(setting.key)}
                  onCheckedChange={(checked) => setValue(setting.key, !!checked)}
                />
                <Label
                  htmlFor={setting.key}
                  className="cursor-pointer text-sm font-medium text-gray-700"
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

        {/* Sticky Footer */}
        <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={isSaving}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {t('Cancel')}
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 disabled:opacity-50"
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
