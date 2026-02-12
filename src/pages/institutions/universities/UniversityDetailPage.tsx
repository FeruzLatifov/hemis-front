import { useParams, useNavigate } from 'react-router-dom'
import {
  useUniversity,
  useUniversityDictionaries,
  useDeleteUniversity,
} from '@/hooks/useUniversities'
import { sanitizeUrl } from '@/utils/url.util'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  ExternalLink,
  Building2,
  MapPin,
  Landmark,
  Globe,
  Settings,
  FileText,
} from 'lucide-react'
import type { Dictionary } from '@/api/universities.api'

/** Resolve classifier code to human-readable name */
function resolve(code: string | undefined, list: Dictionary[] | undefined): string {
  return list?.find((item) => item.code === code)?.name ?? code ?? '—'
}

/** Field row in the detail card */
function Field({
  label,
  value,
  children,
}: {
  label: string
  value?: string | null
  children?: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-x-4 border-b border-gray-50 py-2.5 last:border-b-0">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{children ?? value ?? '—'}</dd>
    </div>
  )
}

/** Boolean indicator */
function BoolField({ label, value }: { label: string; value?: boolean }) {
  const { t } = useTranslation()
  return (
    <Field label={label}>
      <span
        className={`inline-flex items-center gap-1.5 ${value ? 'text-emerald-600' : 'text-gray-400'}`}
      >
        <span
          className={`inline-block h-2 w-2 rounded-full ${value ? 'bg-emerald-500' : 'bg-gray-300'}`}
        />
        {value ? t('Yes') : t('No')}
      </span>
    </Field>
  )
}

/** Link field with external icon */
function LinkField({ label, url }: { label: string; url?: string }) {
  if (!url) return <Field label={label} value="—" />
  // Add https:// if no protocol prefix exists
  const withProtocol = /^https?:\/\//i.test(url) ? url : `https://${url}`
  const sanitized = sanitizeUrl(withProtocol)
  if (!sanitized) return <Field label={label} value="—" />
  return (
    <Field label={label}>
      <a
        href={sanitized}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-600 hover:underline"
      >
        {url}
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </Field>
  )
}

/** Section card */
function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3">
        <span className="text-gray-400">{icon}</span>
        <h3 className="text-sm font-medium tracking-wider text-gray-500 uppercase">{title}</h3>
      </div>
      <dl className="px-5 py-1">{children}</dl>
    </section>
  )
}

/** Loading skeleton for detail page */
function DetailSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-6 w-64 rounded" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
          <Skeleton className="mb-4 h-5 w-40 rounded" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="grid grid-cols-[180px_1fr] gap-x-4">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-48 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function UniversityDetailPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: university, isLoading, isError } = useUniversity(code ?? '')
  const { data: dictionaries } = useUniversityDictionaries()
  const deleteUniversityMutation = useDeleteUniversity()

  if (isLoading) return <DetailSkeleton />

  if (isError || !university) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <Building2 className="h-8 w-8 text-red-400" />
        </div>
        <p className="text-sm font-medium text-gray-900">{t('University not found')}</p>
        <button
          onClick={() => navigate('/institutions/universities')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('Back to list')}
        </button>
      </div>
    )
  }

  const handleDelete = () => {
    deleteUniversityMutation.mutate(code!, {
      onSuccess: () => navigate('/institutions/universities'),
    })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/institutions/universities')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('Back')}
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{university.name}</h1>
            <p className="text-sm text-gray-500">
              {t('Code')}: {university.code}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/institutions/universities/${code}/edit`)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100"
          >
            <Pencil className="h-4 w-4" />
            {t('Edit')}
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100">
                <Trash2 className="h-4 w-4" />
                {t('Delete')}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('Delete university')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t(
                    'Are you sure you want to delete this university? This action cannot be undone.',
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                >
                  {t('Delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
            university.active
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border border-gray-200 bg-gray-50 text-gray-500'
          }`}
        >
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${university.active ? 'bg-emerald-500' : 'bg-gray-400'}`}
          />
          {university.active ? t('Active') : t('Inactive')}
        </span>
      </div>

      {/* Asosiy ma'lumotlar */}
      <Section title={t('Basic information')} icon={<Building2 className="h-4 w-4" />}>
        <Field label={t('Code')} value={university.code} />
        <Field label={t('Name')} value={university.name} />
        <Field label={t('INN')} value={university.tin} />
        <Field
          label={t('Type')}
          value={resolve(university.universityTypeCode, dictionaries?.types)}
        />
        <Field
          label={t('Ownership')}
          value={resolve(university.ownershipCode, dictionaries?.ownerships)}
        />
      </Section>

      {/* Joylashuv */}
      <Section title={t('Location')} icon={<MapPin className="h-4 w-4" />}>
        <Field label={t('Region')} value={resolve(university.regionCode, dictionaries?.regions)} />
        <Field
          label={t('District')}
          value={
            dictionaries?.districts?.find((d) => d.code === university.soatoRegion)?.name ??
            resolve(university.soatoRegion, dictionaries?.regions)
          }
        />
        <Field label={t('Address')} value={university.address} />
        <Field label={t('Mail address')} value={university.mailAddress} />
        <Field label={t('Cadastre')} value={university.cadastre} />
        <Field label={t('Neighborhood')} value={university.terrain} />
      </Section>

      {/* Tashkilot */}
      <Section title={t('Organization')} icon={<Landmark className="h-4 w-4" />}>
        <Field
          label={t('HEMIS version')}
          value={resolve(university.versionTypeCode, dictionaries?.versionTypes)}
        />
        <Field
          label={t('Belongs to')}
          value={resolve(university.belongsToCode, dictionaries?.belongsToOptions)}
        />
        <Field
          label={t('Activity status')}
          value={resolve(university.activityStatusCode, dictionaries?.activityStatuses)}
        />
        <Field
          label={t('Contract category')}
          value={resolve(university.contractCategoryCode, dictionaries?.contractCategories)}
        />
        <Field label={t('Main university')} value={university.parentUniversity} />
      </Section>

      {/* Veb-saytlar */}
      <Section title={t('Websites')} icon={<Globe className="h-4 w-4" />}>
        <LinkField label={t('University URL')} url={university.universityUrl} />
        <LinkField label={t('Teachers portal')} url={university.teacherUrl} />
        <LinkField label={t('Students portal')} url={university.studentUrl} />
        <LinkField label={t('UZBMB URL')} url={university.uzbmbUrl} />
      </Section>

      {/* Sozlamalar */}
      <Section title={t('Settings')} icon={<Settings className="h-4 w-4" />}>
        <BoolField label={t('GPA edit')} value={university.gpaEdit} />
        <BoolField label={t('Accreditation edit')} value={university.accreditationEdit} />
        <BoolField label={t('Add student')} value={university.addStudent} />
        <BoolField label={t('Allow grouping')} value={university.allowGrouping} />
        <BoolField label={t('Allow transfer outside')} value={university.allowTransferOutside} />
      </Section>

      {/* Qo'shimcha */}
      {(university.bankInfo || university.accreditationInfo) && (
        <Section title={t('Additional info')} icon={<FileText className="h-4 w-4" />}>
          {university.bankInfo && (
            <Field label={t('Bank info')}>
              <span className="whitespace-pre-wrap">{university.bankInfo}</span>
            </Field>
          )}
          {university.accreditationInfo && (
            <Field label={t('Accreditation info')}>
              <span className="whitespace-pre-wrap">{university.accreditationInfo}</span>
            </Field>
          )}
        </Section>
      )}
    </div>
  )
}
