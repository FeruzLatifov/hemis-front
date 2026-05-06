/**
 * Tab sections for the university detail view.
 *
 * Five self-contained sections that render different facets of a
 * university record. Pulled out of UniversityDetailPage so the page
 * shell stays focused on routing/tabs.
 *
 * UniversityFormPage also imports FoundersSection / CadastreSection /
 * LifecycleSection from here — they double as edit-page widgets.
 */

import { Users, MapPin, FileText, History, Ban, Share2, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type {
  UniversityFounder,
  UniversityCadastre,
  UniversityLifecycle,
  UniversityOfficial,
  UniversityProfile,
} from '@/types/university.types'
import { Section, Field, LinkField } from './UniversityDetailShared'
import { parseJsonArray } from './university-detail-helpers'

export function FoundersSection({
  founders,
  t,
}: {
  founders: UniversityFounder[]
  t: (key: string) => string
}) {
  if (founders.length === 0)
    return (
      <Section title={t('Founders')} icon={<Users className="h-4 w-4" />}>
        <p className="py-4 text-center text-sm text-[var(--text-secondary)]">
          {t('No data. Use Sync in Edit page.')}
        </p>
      </Section>
    )
  const totalPercent = founders.reduce((sum, f) => sum + (f.sharePercent ?? 0), 0)
  return (
    <Section title={`${t('Founders')} (${founders.length})`} icon={<Users className="h-4 w-4" />}>
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
            {founders.map((f, i) => (
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

export function OfficialsSection({
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
  LICENSE_REVOKED: 'bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400',
  SUSPENDED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400',
  REACTIVATED: 'bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400',
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
