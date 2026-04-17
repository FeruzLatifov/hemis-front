import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useUniversity } from '@/hooks/useUniversities'
import {
  useUniversityDashboard,
  useUniversityOfficials,
  useUniversityProfile,
} from '@/hooks/useUniversity'
import { sanitizeUrl } from '@/utils/url.util'
import { ACTIVITY_STATUS_LABEL_KEY } from './activity-statuses'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Pencil,
  ExternalLink,
  Building2,
  MapPin,
  Landmark,
  Globe,
  Settings,
  FileText,
  Users,
  History,
  Ban,
  Share2,
} from 'lucide-react'
import type {
  UniversityLegal,
  UniversityFounder,
  UniversityCadastre,
  UniversityLifecycle,
  UniversityOfficial,
  UniversityProfile,
} from '@/types/university.types'

// ═══════════ Helpers ═══════════

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
    <div className="grid grid-cols-[180px_1fr] gap-x-4 border-b border-[var(--border-color-pro)] py-2.5 last:border-b-0">
      <dt className="text-sm text-[var(--text-secondary)]">{label}</dt>
      <dd className="text-sm font-medium text-[var(--text-primary)]">{children ?? value ?? '—'}</dd>
    </div>
  )
}

function BoolField({ label, value }: { label: string; value?: boolean }) {
  const { t } = useTranslation()
  return (
    <Field label={label}>
      <span
        className={`inline-flex items-center gap-1.5 ${value ? 'text-emerald-600' : 'text-[var(--text-secondary)]'}`}
      >
        <span
          className={`inline-block h-2 w-2 rounded-full ${value ? 'bg-emerald-500' : 'bg-[var(--border-color-pro)]'}`}
        />
        {value ? t('Yes') : t('No')}
      </span>
    </Field>
  )
}

function LinkField({ label, url }: { label: string; url?: string }) {
  if (!url) return <Field label={label} value="—" />
  const withProtocol = /^https?:\/\//i.test(url) ? url : `https://${url}`
  const sanitized = sanitizeUrl(withProtocol)
  if (!sanitized) return <Field label={label} value="—" />
  return (
    <Field label={label}>
      <a
        href={sanitized}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-blue-500 hover:underline"
      >
        {url} <ExternalLink className="h-4 w-4" />
      </a>
    </Field>
  )
}

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
    <section className="rounded-xl border border-[var(--border-color-pro)] bg-[var(--card-bg)]">
      <div className="flex items-center gap-2 border-b border-[var(--border-color-pro)] px-5 py-3">
        <span className="text-[var(--text-secondary)]">{icon}</span>
        <h3 className="text-sm font-medium tracking-wider text-[var(--text-secondary)] uppercase">
          {title}
        </h3>
      </div>
      <dl className="px-5 py-1">{children}</dl>
    </section>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-10 w-96 rounded" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

function parseBanks(
  raw: string | null,
): Array<{ mfo?: string; paymentAccount?: string; status?: number; openDate?: string }> {
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function parseJsonArray(raw: string | null): Array<Record<string, unknown>> {
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

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
  const director = extData?.legal
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
            <span className="text-xs text-[var(--text-secondary)]">{t('Director (legal)')}</span>
            <p className="text-sm font-medium">{director?.director?.fullName || '—'}</p>
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

        {/* ══ TAB: LEGAL ══ */}
        <TabsContent value="legal" className="space-y-4">
          <LegalSection legal={extData?.legal ?? null} t={t} />
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

// ═══════════ TAB SECTIONS ═══════════

export function LegalSection({
  legal,
  t,
}: {
  legal: UniversityLegal | null
  t: (key: string) => string
}) {
  if (!legal)
    return (
      <Section title={t('Legal entity')} icon={<Landmark className="h-4 w-4" />}>
        <p className="py-4 text-center text-sm text-[var(--text-secondary)]">
          {t('No data. Use Sync in Edit page.')}
        </p>
      </Section>
    )
  // Backend ClassifierLookupService resolves SOATO → name. We just render.
  const soatoDisplay = legal.billingSoatoName
    ? `${legal.billingSoatoName} (${legal.billingSoato})`
    : legal.billingSoato || '—'
  const banks = parseBanks(legal.bankAccounts)
  const director = legal.director
  const accountant = legal.accountant
  const opfMap: Record<number, string> = {
    152: 'MCH',
    270: 'DM',
    143: 'AJ',
    160: 'UK',
    100: 'YaTT',
  }
  const kfsMap: Record<number, string> = { 100: 'Xususiy', 200: 'Davlat', 300: 'Xorijiy' }
  const statusMap: Record<number, string> = { 0: 'Faol', 1: 'Tugatilgan', 2: "To'xtatilgan" }

  return (
    <>
      <Section title={t('Legal entity')} icon={<Landmark className="h-4 w-4" />}>
        <Field label={t('Full name')} value={legal.shortName} />
        <Field label={t('INN')} value={legal.tin} />
        {legal.opf != null && (
          <Field
            label={t('Legal form')}
            value={`${opfMap[legal.opf] ?? legal.opf} (${legal.opf})`}
          />
        )}
        {legal.kfs != null && (
          <Field
            label={t('Ownership form')}
            value={`${kfsMap[legal.kfs] ?? legal.kfs} (${legal.kfs})`}
          />
        )}
        <Field label={t('OKED')} value={legal.oked} />
        <Field label={t('Registration number')} value={legal.registrationNumber} />
        <Field label={t('Registration date')} value={legal.registrationDate} />
        {legal.reregistrationDate && (
          <Field label={t('Re-registration date')} value={legal.reregistrationDate} />
        )}
        {legal.status != null && (
          <Field label={t('Status')} value={statusMap[legal.status] ?? String(legal.status)} />
        )}
        {legal.avgEmployees != null && (
          <Field label={t('Average employees')} value={String(legal.avgEmployees)} />
        )}
        {legal.syncedAt && (
          <Field label={t('Last synced')} value={new Date(legal.syncedAt).toLocaleString()} />
        )}
      </Section>

      <Section title={t('Director (legal representative)')} icon={<Users className="h-4 w-4" />}>
        <Field label={t('Full name')} value={director?.fullName} />
        <Field label={t('PINFL')} value={director?.pinfl} />
        {director?.tin ? <Field label={t('INN')} value={director.tin} /> : null}
        {director?.passport ? <Field label={t('Passport')} value={director.passport} /> : null}
        {director?.phone ? <Field label={t('Phone')} value={director.phone} /> : null}
        {director?.email ? <Field label={t('Email')} value={director.email} /> : null}
        {director?.address ? <Field label={t('Address')} value={director.address} /> : null}
      </Section>

      <Section title={t('Accountant')} icon={<Users className="h-4 w-4" />}>
        <Field label={t('Full name')} value={accountant?.fullName} />
        <Field label={t('PINFL')} value={accountant?.pinfl} />
        {accountant?.tin ? <Field label={t('INN')} value={accountant.tin} /> : null}
        {accountant?.passport ? <Field label={t('Passport')} value={accountant.passport} /> : null}
        {accountant?.phone ? <Field label={t('Phone')} value={accountant.phone} /> : null}
        {accountant?.email ? <Field label={t('Email')} value={accountant.email} /> : null}
        {accountant?.address ? <Field label={t('Address')} value={accountant.address} /> : null}
      </Section>

      <Section title={t('Legal address')} icon={<MapPin className="h-4 w-4" />}>
        <Field label={t('Address')} value={legal.billingStreet} />
        <Field label={t('SOATO')} value={soatoDisplay} />
        {legal.billingCadastre && <Field label={t('Cadastre')} value={legal.billingCadastre} />}
        {legal.billingPostcode && <Field label={t('Postcode')} value={legal.billingPostcode} />}
      </Section>

      {banks.length > 0 && (
        <Section
          title={`${t('Bank accounts')} (${banks.length})`}
          icon={<FileText className="h-4 w-4" />}
        >
          {banks.map((b, i) => (
            <div
              key={i}
              className="border-b border-[var(--border-color-pro)] py-2.5 text-sm last:border-b-0"
            >
              <div className="grid grid-cols-[120px_1fr] gap-x-4">
                <span className="text-[var(--text-secondary)]">MFO</span>
                <span className="font-medium">{b.mfo || '—'}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-x-4">
                <span className="text-[var(--text-secondary)]">{t('Account')}</span>
                <span className="font-mono font-medium">{b.paymentAccount || '—'}</span>
              </div>
              {b.openDate && (
                <div className="grid grid-cols-[120px_1fr] gap-x-4">
                  <span className="text-[var(--text-secondary)]">{t('Opened')}</span>
                  <span>{b.openDate}</span>
                </div>
              )}
              {b.status != null && (
                <div className="grid grid-cols-[120px_1fr] gap-x-4">
                  <span className="text-[var(--text-secondary)]">{t('Status')}</span>
                  <span>{b.status === 0 ? t('Active') : t('Closed')}</span>
                </div>
              )}
            </div>
          ))}
        </Section>
      )}
    </>
  )
}

export function FoundersSection({
  founders,
  t,
}: {
  founders: UniversityFounder[]
  t: (key: string) => string
}) {
  const current = founders.filter((f) => f.isCurrent)
  if (current.length === 0)
    return (
      <Section title={t('Founders')} icon={<Users className="h-4 w-4" />}>
        <p className="py-4 text-center text-sm text-[var(--text-secondary)]">
          {t('No data. Use Sync in Edit page.')}
        </p>
      </Section>
    )
  const totalPercent = current.reduce((sum, f) => sum + (f.sharePercent ?? 0), 0)
  return (
    <Section title={`${t('Founders')} (${current.length})`} icon={<Users className="h-4 w-4" />}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-color-pro)] text-left text-xs text-[var(--text-secondary)]">
              <th className="py-2 pr-4">#</th>
              <th className="py-2 pr-4">{t('Type')}</th>
              <th className="py-2 pr-4">{t('Name')}</th>
              <th className="py-2 pr-4">{t('INN')}</th>
              <th className="py-2 pr-4">{t('PINFL')}</th>
              <th className="py-2 text-right">{t('Share')}</th>
            </tr>
          </thead>
          <tbody>
            {current.map((f, i) => (
              <tr
                key={`${f.founderType}-${f.tin ?? f.pinfl ?? i}`}
                className="border-b border-[var(--border-color-pro)] last:border-b-0"
              >
                <td className="py-2.5 pr-4 text-[var(--text-secondary)]">{i + 1}</td>
                <td className="py-2.5 pr-4">
                  <Badge
                    variant={f.founderType === 'legal' ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {f.founderType === 'legal' ? t('Legal') : t('Individual')}
                  </Badge>
                </td>
                <td className="py-2.5 pr-4 font-medium">{f.name || '—'}</td>
                <td className="py-2.5 pr-4 font-mono text-xs">{f.tin || '—'}</td>
                <td className="py-2.5 pr-4 font-mono text-xs">{f.pinfl || '—'}</td>
                <td className="py-2.5 text-right font-medium">
                  {f.sharePercent != null ? `${f.sharePercent}%` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[var(--border-color-pro)]">
              <td
                colSpan={5}
                className="py-2 text-right text-xs font-medium text-[var(--text-secondary)]"
              >
                {t('Total')}
              </td>
              <td className="py-2 text-right font-semibold">{totalPercent}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Section>
  )
}

function OfficialsSection({
  officials,
  rector,
  t,
}: {
  officials: UniversityOfficial[]
  rector: {
    firstname: string | null
    lastname: string | null
    fathername: string | null
    pinfl: string | null
    phone: string | null
    positionName: string | null
  } | null
  t: (key: string) => string
}) {
  const hasMinistryOfficials = officials.length > 0
  // Show rector from old table ONLY if no ministry officials exist (avoid duplicates)
  const showLegacyRector = rector && !hasMinistryOfficials

  return (
    <Section
      title={`${t('Officials')} (${hasMinistryOfficials ? officials.length : rector ? 1 : 0})`}
      icon={<Users className="h-4 w-4" />}
    >
      {hasMinistryOfficials ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color-pro)] text-left text-xs text-[var(--text-secondary)]">
                <th className="py-2 pr-4">{t('Position')}</th>
                <th className="py-2 pr-4">{t('Full name')}</th>
                <th className="py-2 pr-4">{t('PINFL')}</th>
                <th className="py-2 pr-4">{t('Phone')}</th>
                <th className="py-2 pr-4">{t('Decree')}</th>
              </tr>
            </thead>
            <tbody>
              {officials.map((o) => (
                <tr
                  key={o.metaId}
                  className="border-b border-[var(--border-color-pro)] last:border-b-0"
                >
                  <td className="py-2.5 pr-4 font-medium">{o.positionName || o.positionCode}</td>
                  <td className="py-2.5 pr-4">
                    {o.lastName} {o.firstName} {o.middleName ?? ''}
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-xs">{o.pinfl}</td>
                  <td className="py-2.5 pr-4">{o.phone || '—'}</td>
                  <td className="py-2.5 pr-4 text-xs text-[var(--text-secondary)]">
                    {o.decreeNumber || '—'} {o.decreeDate ? `(${o.decreeDate})` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : showLegacyRector ? (
        <>
          <Field label={t('Position')} value={rector.positionName} />
          <Field
            label={t('Full name')}
            value={
              `${rector.lastname ?? ''} ${rector.firstname ?? ''} ${rector.fathername ?? ''}`.trim() ||
              null
            }
          />
          {rector.pinfl && <Field label={t('PINFL')} value={rector.pinfl} />}
          {rector.phone && <Field label={t('Phone')} value={rector.phone} />}
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            {t('Source: university sync. Use Edit to appoint via ministry.')}
          </p>
        </>
      ) : (
        <p className="py-4 text-center text-sm text-[var(--text-secondary)]">
          {t('No officials. Use Edit page to appoint.')}
        </p>
      )}
    </Section>
  )
}

export function CadastreSection({
  cadastre,
  t,
}: {
  cadastre: UniversityCadastre[]
  t: (key: string) => string
}) {
  if (cadastre.length === 0)
    return (
      <Section title={t('Real estate')} icon={<MapPin className="h-4 w-4" />}>
        <p className="py-4 text-center text-sm text-[var(--text-secondary)]">
          {t('No data. Use Sync in Edit page.')}
        </p>
      </Section>
    )
  return (
    <Section
      title={`${t('Real estate')} (${cadastre.length})`}
      icon={<MapPin className="h-4 w-4" />}
    >
      {cadastre.map((c) => {
        const subjects = parseJsonArray(c.subjects)
        const docs = parseJsonArray(c.documents)
        return (
          <div
            key={c.id}
            className="border-b border-[var(--border-color-pro)] py-4 last:border-b-0"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-semibold">{c.cadNumber}</span>
              <div className="flex gap-2">
                {c.tipText && (
                  <Badge variant="outline" className="text-xs">
                    {c.tipText}
                  </Badge>
                )}
                {c.banIs && (
                  <Badge variant="destructive" className="text-xs">
                    <Ban className="mr-1 h-3 w-3" />
                    {t('Restricted')}
                  </Badge>
                )}
              </div>
            </div>
            <div className="mt-2 grid grid-cols-[140px_1fr] gap-x-4 gap-y-1 text-sm">
              <span className="text-[var(--text-secondary)]">{t('Region')}</span>
              <span>
                {c.region || '—'}, {c.district || ''}
              </span>
              <span className="text-[var(--text-secondary)]">{t('Address')}</span>
              <span>{c.address || c.shortAddress || '—'}</span>
              <span className="text-[var(--text-secondary)]">{t('Building area')}</span>
              <span>{c.objectArea > 0 ? `${c.objectArea} m²` : '—'}</span>
              <span className="text-[var(--text-secondary)]">{t('Land area')}</span>
              <span>{c.landAreaB != null && c.landAreaB > 0 ? `${c.landAreaB} m²` : '—'}</span>
              <span className="text-[var(--text-secondary)]">{t('Cadastre value')}</span>
              <span className="font-medium">
                {c.cost != null ? `${Number(c.cost).toLocaleString()} UZS` : '—'}
              </span>
            </div>
            {subjects.length > 0 && (
              <div className="mt-2 text-xs">
                <span className="text-[var(--text-secondary)]">{t('Owners')}:</span>
                {subjects.map((s, i) => (
                  <span key={i} className="ml-2">
                    {String(s.name || '')} ({String(s.percent || '')})
                  </span>
                ))}
              </div>
            )}
            {docs.length > 0 && (
              <div className="mt-1 text-xs">
                <span className="text-[var(--text-secondary)]">{t('Documents')}:</span>
                {docs.map((d, i) => (
                  <span key={i} className="ml-2">
                    {String(d.type || '')} #{String(d.num || '')} {String(d.date || '')}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </Section>
  )
}

const typeColors: Record<string, string> = {
  CLOSED: 'bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400',
  MERGED: 'bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400',
  SPLIT: 'bg-orange-100 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400',
  LICENSE_REVOKED: 'bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400',
  SUSPENDED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400',
  REACTIVATED: 'bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400',
  RENAMED: 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400',
  REORGANIZED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400',
}

export function ProfileSection({
  profile,
  t,
}: {
  profile: UniversityProfile | null
  t: (key: string) => string
}) {
  const hasAnyContact = profile && (profile.phone || profile.email || profile.description)
  const socials = profile?.socialLinks
  const hasAnySocial =
    socials && Object.values(socials).some((v) => v && v.toString().trim() !== '')
  const docs = profile?.documents ?? []

  if (!profile || (!hasAnyContact && !hasAnySocial && docs.length === 0)) {
    return (
      <Section title={t('Profile')} icon={<Share2 className="h-4 w-4" />}>
        <p className="py-4 text-center text-sm text-[var(--text-secondary)]">
          {t('No data. Use Edit page to add contacts, social links, and documents.')}
        </p>
      </Section>
    )
  }

  return (
    <>
      {hasAnyContact && (
        <Section title={t('Contacts')} icon={<Users className="h-4 w-4" />}>
          {profile.phone && <Field label={t('Phone')} value={profile.phone} />}
          {profile.email && <Field label={t('Email')} value={profile.email} />}
          {profile.description && <Field label={t('Description')} value={profile.description} />}
        </Section>
      )}

      {hasAnySocial && (
        <Section title={t('Social links')} icon={<Share2 className="h-4 w-4" />}>
          {socials?.website && <LinkField label={t('Website')} url={socials.website} />}
          {socials?.telegram && <LinkField label={t('Telegram')} url={socials.telegram} />}
          {socials?.instagram && <LinkField label={t('Instagram')} url={socials.instagram} />}
          {socials?.youtube && <LinkField label={t('YouTube')} url={socials.youtube} />}
          {socials?.facebook && <LinkField label={t('Facebook')} url={socials.facebook} />}
          {socials?.twitter && <LinkField label={t('Twitter')} url={socials.twitter} />}
          {socials?.linkedin && <LinkField label={t('LinkedIn')} url={socials.linkedin} />}
        </Section>
      )}

      {profile && (profile.mapUrl || (profile.latitude != null && profile.longitude != null)) && (
        <Section title={t('Map location')} icon={<MapPin className="h-4 w-4" />}>
          {profile.mapUrl && (
            <div className="py-2">
              <a
                href={profile.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                <ExternalLink className="h-4 w-4" />
                {t('Open in map')}
              </a>
            </div>
          )}
          {profile.latitude != null && profile.longitude != null && (
            <>
              <Field label={t('Latitude')} value={String(profile.latitude)} />
              <Field label={t('Longitude')} value={String(profile.longitude)} />
              <div className="py-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${profile.latitude},${profile.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t('Get directions')}
                </a>
              </div>
            </>
          )}
        </Section>
      )}

      {docs.length > 0 && (
        <Section
          title={`${t('Documents')} (${docs.length})`}
          icon={<FileText className="h-4 w-4" />}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color-pro)] text-left text-xs text-[var(--text-secondary)]">
                  <th className="py-2 pr-4">{t('Type')}</th>
                  <th className="py-2 pr-4">{t('Name')}</th>
                  <th className="py-2 pr-4">{t('Valid from')}</th>
                  <th className="py-2 pr-4">{t('Valid to')}</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d, i) => (
                  <tr key={i} className="border-b border-[var(--border-color-pro)] last:border-b-0">
                    <td className="py-2.5 pr-4">
                      <Badge variant="outline" className="text-xs">
                        {t(d.type)}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-4 font-medium">{d.name}</td>
                    <td className="py-2.5 pr-4 text-[var(--text-secondary)]">
                      {d.validFrom || '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-[var(--text-secondary)]">{d.validTo || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </>
  )
}

export function LifecycleSection({
  lifecycle,
  t,
}: {
  lifecycle: UniversityLifecycle[]
  t: (key: string) => string
}) {
  if (lifecycle.length === 0)
    return (
      <Section title={t('Lifecycle')} icon={<History className="h-4 w-4" />}>
        <p className="py-4 text-center text-sm text-[var(--text-secondary)]">
          {t('No lifecycle events')}
        </p>
      </Section>
    )
  return (
    <Section
      title={`${t('Lifecycle')} (${lifecycle.length})`}
      icon={<History className="h-4 w-4" />}
    >
      {lifecycle.map((e) => (
        <div
          key={e.id}
          className="flex items-start gap-3 border-b border-[var(--border-color-pro)] py-3 last:border-b-0"
        >
          <span className="mt-0.5 shrink-0 text-xs text-[var(--text-secondary)]">
            {e.eventDate}
          </span>
          <Badge className={typeColors[e.eventType] ?? 'bg-gray-100 text-gray-700'}>
            {e.eventType}
          </Badge>
          <div className="text-sm">
            <span className="text-[var(--text-primary)]">{e.note || ''}</span>
            {e.successorCode && (
              <span className="ml-1 text-[var(--text-secondary)]">
                {'\u2192'} {e.successorCode}
              </span>
            )}
            {e.decreeNumber && (
              <span className="ml-2 text-xs text-[var(--text-secondary)]">
                ({t('Decree')}: {e.decreeNumber})
              </span>
            )}
          </div>
        </div>
      ))}
    </Section>
  )
}
