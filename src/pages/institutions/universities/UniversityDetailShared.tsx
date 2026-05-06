/**
 * Shared building blocks for the university detail view.
 *
 * Pulled out of UniversityDetailPage so the section components
 * (Founders, Officials, Cadastre, Profile, Lifecycle) can live in their
 * own file without creating an import cycle.
 *
 * Three primitives:
 *   - `Field` — label/value row inside a `<dl>`.
 *   - `BoolField` — yes/no with a coloured dot indicator.
 *   - `LinkField` — sanitised external URL with new-tab behaviour.
 *   - `Section` — card-style container that hosts a list of `Field`s.
 *   - `DetailSkeleton` — loading placeholder for the page shell.
 */

import { useTranslation } from 'react-i18next'
import { ExternalLink } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { sanitizeUrl } from '@/utils/url.util'

export function Field({
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

export function BoolField({ label, value }: { label: string; value?: boolean }) {
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

export function LinkField({ label, url }: { label: string; url?: string }) {
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

export function Section({
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

export function DetailSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-10 w-96 rounded" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}
