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
  return (
    <tr
      className="border-b transition-colors"
      style={{
        borderColor: 'var(--border-color-pro)',
        backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(102, 126, 234, 0.02)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--active-bg)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor =
          index % 2 === 0 ? 'transparent' : 'rgba(102, 126, 234, 0.02)'
      }}
    >
      <td className="px-4 py-3 text-sm">
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold shadow-sm"
          style={{
            backgroundColor: 'var(--primary)',
            color: 'white',
          }}
        >
          {translation.category}
        </span>
      </td>
      <td
        className="px-4 py-3 font-mono text-sm font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        {translation.messageKey}
      </td>
      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
        {translation.message}
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onToggleActive(translation.id)}
          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold shadow-sm transition-all ${
            translation.isActive
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-gray-400 text-white hover:bg-gray-500'
          }`}
        >
          {translation.isActive ? '✓' : '○'}
        </button>
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onEdit(translation.id)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md"
          style={{ backgroundColor: 'var(--primary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--primary-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--primary)'
          }}
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
          <div
            className="mb-3 inline-block h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"
            style={{ borderColor: 'var(--primary)' }}
          ></div>
          <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {t('Loading...')}
          </p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="font-semibold" style={{ color: 'var(--danger)' }}>
          {t('Error')}: {error?.message || t('Failed to load translations')}
        </p>
      </div>
    )
  }

  if (translations.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
          {t('No translations found')}
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Scrollable Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          {/* Sticky Table Header */}
          <thead
            className="sticky top-0 z-10"
            style={{
              backgroundColor: 'var(--primary)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
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
      <div
        className="sticky bottom-0 flex items-center justify-between border-t px-4 py-3"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border-color-pro)',
          boxShadow: '0 -1px 4px rgba(0,0,0,0.05)',
        }}
      >
        <div
          className="flex items-center gap-2 text-sm font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          <span
            className="rounded-md px-2.5 py-1 font-bold text-white"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            {totalItems}
          </span>
          <span>{t('items')}</span>
          <span className="mx-1" style={{ color: 'var(--text-secondary)' }}>
            •
          </span>
          <span>{t('Page')}</span>
          <span
            className="rounded-md px-2.5 py-1 font-bold text-white"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            {currentPage + 1}
          </span>
          <span>/</span>
          <span>{totalPages}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-30"
            style={{
              borderColor: currentPage === 0 ? 'var(--border-color-pro)' : 'var(--primary)',
              backgroundColor: 'var(--card-bg)',
              color: currentPage === 0 ? 'var(--text-secondary)' : 'var(--primary)',
            }}
          >
            ← {t('Previous')}
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            className="rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-30"
            style={{
              borderColor:
                currentPage >= totalPages - 1 ? 'var(--border-color-pro)' : 'var(--primary)',
              backgroundColor: 'var(--card-bg)',
              color: currentPage >= totalPages - 1 ? 'var(--text-secondary)' : 'var(--primary)',
            }}
          >
            {t('Next')} →
          </button>
        </div>
      </div>
    </>
  )
}
