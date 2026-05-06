import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useUniversity } from '@/hooks/useUniversities'
import {
  useUniversityDashboard,
  useUniversityOfficials,
  useUniversityProfile,
} from '@/hooks/useUniversity'
import { ACTIVITY_STATUS_LABEL_KEY } from './activity-statuses'
import { useTranslation } from 'react-i18next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Pencil,
  Building2,
  MapPin,
  Landmark,
  Globe,
  Settings,
  Users,
  History,
  Share2,
} from 'lucide-react'
import { DetailSkeleton, BoolField, Field, LinkField, Section } from './UniversityDetailShared'
import {
  FoundersSection,
  OfficialsSection,
  CadastreSection,
  ProfileSection,
  LifecycleSection,
} from './UniversityDetailSections'

// Re-export the sections that other pages (UniversityFormPage) consume
// from this module — keeps existing import paths working.
export {
  FoundersSection,
  CadastreSection,
  ProfileSection,
  LifecycleSection,
} from './UniversityDetailSections'

// ═══════════ MAIN COMPONENT ═══════════

export default function UniversityDetailPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'general'

  const { data: university, isLoading, isError } = useUniversity(code ?? '')
  const { data: extData } = useUniversityDashboard(code ?? '')
  const { data: officials } = useUniversityOfficials(code ?? '')
  const { data: profile } = useUniversityProfile(code ?? '')

  if (isLoading) return <DetailSkeleton />
  if (isError || !university) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Building2 className="h-12 w-12 text-[var(--text-secondary)]" />
        <p className="text-sm text-[var(--text-secondary)]">{t('University not found')}</p>
        <button
          onClick={() => navigate('/institutions/universities')}
          className="text-sm text-blue-500 hover:underline"
        >
          {t('Back to list')}
        </button>
      </div>
    )
  }

  const rector = extData?.rector
  const setTab = (tab: string) => setSearchParams({ tab })

  return (
    <div className="mx-auto max-w-5xl p-4">
      {/* ═══════════ HEADER ═══════════ */}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/institutions/universities')}
          className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => navigate(`/institutions/universities/${code}/edit`)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100 dark:border-blue-900/30 dark:bg-blue-950/20"
        >
          <Pencil className="h-4 w-4" />
          {t('Edit')}
        </button>
      </div>

      {/* ═══════════ SUMMARY CARD ═══════════ */}
      <div className="mb-6 rounded-xl border border-[var(--border-color-pro)] bg-[var(--card-bg)] p-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">{university.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
              <span>
                {t('Code')}:{' '}
                <strong className="text-[var(--text-primary)]">{university.code}</strong>
              </span>
              <span>
                INN: <strong className="text-[var(--text-primary)]">{university.tin || '—'}</strong>
              </span>
              <span>{university.ownership || '—'}</span>
              <span>{university.universityType || '—'}</span>
            </div>
          </div>
          <Badge
            variant={university.active ? 'default' : 'destructive'}
            className={
              university.active
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                : ''
            }
          >
            {(() => {
              const key =
                university.activityStatusCode &&
                ACTIVITY_STATUS_LABEL_KEY[university.activityStatusCode]
              return key ? t(key) : university.activityStatus || '—'
            })()}
          </Badge>
        </div>

        {/* Key people — compact row */}
        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[var(--border-color-pro)] pt-4 md:grid-cols-3">
          <div>
            <span className="text-xs text-[var(--text-secondary)]">{t('Rector')}</span>
            <p className="text-sm font-medium">
              {rector ? `${rector.lastname} ${rector.firstname}` : '—'}
            </p>
          </div>
          <div>
            <span className="text-xs text-[var(--text-secondary)]">{t('Region')}</span>
            <p className="text-sm font-medium">{university.region || '—'}</p>
          </div>
        </div>
      </div>

      {/* ═══════════ TABS ═══════════ */}
      <Tabs value={activeTab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="general" className="gap-1.5">
            <Building2 className="h-4 w-4" />
            {t('General')}
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-1.5">
            <Share2 className="h-4 w-4" />
            {t('Profile')}
          </TabsTrigger>
          <TabsTrigger value="officials" className="gap-1.5">
            <Users className="h-4 w-4" />
            {t('Officials')}
          </TabsTrigger>
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

        {/* ══ TAB: GENERAL ══ */}
        <TabsContent value="general" className="space-y-4">
          <Section title={t('Basic information')} icon={<Building2 className="h-4 w-4" />}>
            <Field label={t('Code')} value={university.code} />
            <Field label={t('Name')} value={university.name} />
            <Field label={t('INN')} value={university.tin} />
            <Field label={t('Type')} value={university.universityType} />
            <Field label={t('Ownership')} value={university.ownership} />
          </Section>

          <Section title={t('Location')} icon={<MapPin className="h-4 w-4" />}>
            <Field label={t('Region')} value={university.region} />
            <Field label={t('District')} value={university.soatoRegionName} />
            <Field label={t('Address')} value={university.address} />
            <Field label={t('Mail address')} value={university.mailAddress} />
            <Field label={t('Cadastre')} value={university.cadastre} />
          </Section>

          <Section title={t('URLs')} icon={<Globe className="h-4 w-4" />}>
            <LinkField label={t('University site')} url={university.universityUrl} />
            <LinkField label={t('Teachers')} url={university.teacherUrl} />
            <LinkField label={t('Students')} url={university.studentUrl} />
            <LinkField label={t('UZBMB')} url={university.uzbmbUrl} />
          </Section>
        </TabsContent>

        {/* ══ TAB: SETTINGS ══ */}
        <TabsContent value="organization" className="space-y-4">
          <Section title={t('HEMIS configuration')} icon={<Landmark className="h-4 w-4" />}>
            <Field label={t('HEMIS version')} value={university.versionType} />
            <Field label={t('Belongs to')} value={university.belongsTo} />
            <Field
              label={t('Activity status')}
              value={
                university.activityStatusCode &&
                ACTIVITY_STATUS_LABEL_KEY[university.activityStatusCode]
                  ? t(ACTIVITY_STATUS_LABEL_KEY[university.activityStatusCode])
                  : university.activityStatus
              }
            />
            <Field label={t('Contract category')} value={university.contractCategory} />
            <Field label={t('Main university')} value={university.parentUniversity} />
          </Section>

          <Section title={t('Feature flags')} icon={<Settings className="h-4 w-4" />}>
            <BoolField label={t('GPA edit')} value={university.gpaEdit} />
            <BoolField label={t('Accreditation edit')} value={university.accreditationEdit} />
            <BoolField label={t('Add student')} value={university.addStudent} />
            <BoolField label={t('Allow grouping')} value={university.allowGrouping} />
            <BoolField
              label={t('Allow transfer outside')}
              value={university.allowTransferOutside}
            />
            <BoolField label={t('OneID login')} value={university.oneId} />
            <BoolField label={t('Grading system')} value={university.gradingSystem} />
            <BoolField label={t('Add foreign student')} value={university.addForeignStudent} />
            <BoolField label={t('Add transfer student')} value={university.addTransferStudent} />
            <BoolField
              label={t('Add academic mobile student')}
              value={university.addAcademicMobileStudent}
            />
          </Section>
        </TabsContent>

        {/* ══ TAB: FOUNDERS ══ */}
        <TabsContent value="founders" className="space-y-4">
          <FoundersSection founders={extData?.founders ?? []} t={t} />
        </TabsContent>

        {/* ══ TAB: PROFILE ══ */}
        <TabsContent value="profile" className="space-y-4">
          <ProfileSection profile={profile ?? null} t={t} />
        </TabsContent>

        {/* ══ TAB: OFFICIALS ══ */}
        <TabsContent value="officials" className="space-y-4">
          <OfficialsSection officials={officials ?? []} rector={extData?.rector ?? null} t={t} />
        </TabsContent>

        {/* ══ TAB: PROPERTY ══ */}
        <TabsContent value="property" className="space-y-4">
          <CadastreSection cadastre={extData?.cadastre ?? []} t={t} />
        </TabsContent>

        {/* ══ TAB: HISTORY ══ */}
        <TabsContent value="history" className="space-y-4">
          <LifecycleSection lifecycle={extData?.lifecycle ?? []} t={t} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
