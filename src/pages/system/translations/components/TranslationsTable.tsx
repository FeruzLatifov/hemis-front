/**
 * Translations Table Component
 *
 * Displays translations in a table with pagination
 */

import { memo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Edit } from 'lucide-react'
import type { Translation } from '@/api/translations.api'

interface TranslationsTableProps {
  translations: Translation[]
  loading: boolean
  isError: boolean
  error: Error | null
  currentPage: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
  onToggleActive: (id: string) => void
}

// Memoized table row component
const TranslationRow = memo(function TranslationRow({
  translation,
  index,
  onToggleActive,
  onEdit,
  t,
}: {
  translation: Translation
  index: number
  onToggleActive: (id: string) => void
  onEdit: (id: string) => void
  t: (key: string) => string
}) {
  // Row striping is index-driven (not :nth-child) because the table has no <thead>
  // sibling that would offset CSS-based even/odd selectors after pagination.
  const stripe = index % 2 === 0 ? 'bg-transparent' : 'bg-[rgba(102,126,234,0.02)]'
  return (
    <tr
      className={`border-b border-[var(--border-color-pro)] transition-colors hover:bg-[var(--active-bg)] ${stripe}`}
    >
      <td className="px-4 py-3 text-sm">
        <span className="inline-flex items-center rounded-full bg-[var(--primary)] px-2.5 py-1 text-xs font-bold text-white shadow-sm">
          {translation.category}
        </span>
      </td>
      <td className="px-4 py-3 font-mono text-sm font-semibold text-[var(--text-primary)]">
        {translation.messageKey}
      </td>
      <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{translation.message}</td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onToggleActive(translation.id)}
          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold shadow-sm transition-all ${
            translation.isActive
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-muted-foreground text-background hover:bg-muted-foreground/80'
          }`}
        >
          {translation.isActive ? '✓' : '○'}
        </button>
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onEdit(translation.id)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[var(--primary-hover)] hover:shadow-md"
        >
          <Edit className="h-3.5 w-3.5" />
          {t('Edit')}
        </button>
      </td>
    </tr>
  )
})

export function TranslationsTable({
  translations,
  loading,
  isError,
  error,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  onToggleActive,
}: TranslationsTableProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleEdit = useCallback(
    (id: string) => {
      navigate(`/system/translation/${id}/edit`)
    },
    [navigate],
  )

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mb-3 inline-block h-10 w-10 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
          <p className="font-semibold text-[var(--text-secondary)]">{t('Loading...')}</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="font-semibold text-[var(--danger)]">
          {t('Error')}: {error?.message || t('Failed to load translations')}
        </p>
      </div>
    )
  }

  if (translations.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="font-semibold text-[var(--text-secondary)]">{t('No translations found')}</p>
      </div>
    )
  }

  return (
    <>
      {/* Scrollable Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          {/* Sticky Table Header */}
          <thead className="sticky top-0 z-10 bg-[var(--primary)] shadow-[var(--shadow-sm)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold tracking-wide text-white uppercase">
                {t('Category')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold tracking-wide text-white uppercase">
                {t('Key')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold tracking-wide text-white uppercase">
                {t('Text')} (uz)
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold tracking-wide text-white uppercase">
                {t('Status')}
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold tracking-wide text-white uppercase">
                {t('Actions')}
              </th>
            </tr>
          </thead>
          {/* Table Body */}
          <tbody>
            {translations.map((translation, index) => (
              <TranslationRow
                key={translation.id}
                translation={translation}
                index={index}
                onToggleActive={onToggleActive}
                onEdit={handleEdit}
                t={t}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Sticky Pagination Footer */}
      <div className="sticky bottom-0 flex items-center justify-between border-t border-[var(--border-color-pro)] bg-[var(--card-bg)] px-4 py-3 shadow-[0_-1px_4px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <span className="rounded-md bg-[var(--primary)] px-2.5 py-1 font-bold text-white">
            {totalItems}
          </span>
          <span>{t('items')}</span>
          <span className="mx-1 text-[var(--text-secondary)]">•</span>
          <span>{t('Page')}</span>
          <span className="rounded-md bg-[var(--primary)] px-2.5 py-1 font-bold text-white">
            {currentPage + 1}
          </span>
          <span>/</span>
          <span>{totalPages}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className={`rounded-lg border-2 bg-[var(--card-bg)] px-4 py-2 text-sm font-semibold transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-30 ${
              currentPage === 0
                ? 'border-[var(--border-color-pro)] text-[var(--text-secondary)]'
                : 'border-[var(--primary)] text-[var(--primary)]'
            }`}
          >
            ← {t('Previous')}
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            className={`rounded-lg border-2 bg-[var(--card-bg)] px-4 py-2 text-sm font-semibold transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-30 ${
              currentPage >= totalPages - 1
                ? 'border-[var(--border-color-pro)] text-[var(--text-secondary)]'
                : 'border-[var(--primary)] text-[var(--primary)]'
            }`}
          >
            {t('Next')} →
          </button>
        </div>
      </div>
    </>
  )
}
