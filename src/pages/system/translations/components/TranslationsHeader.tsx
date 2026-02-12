/**
 * Translations Header Component
 *
 * Title and action buttons for translations page
 */

import { useTranslation } from 'react-i18next'
import { Copy, Download, Trash2, FileCode } from 'lucide-react'

interface TranslationsHeaderProps {
  loadingDuplicates: boolean
  onFindDuplicates: () => void
  onDownloadJson: () => void
  onClearCache: () => void
  onRegenerateFiles: () => void
}

export function TranslationsHeader({
  loadingDuplicates,
  onFindDuplicates,
  onDownloadJson,
  onClearCache,
  onRegenerateFiles,
}: TranslationsHeaderProps) {
  const { t } = useTranslation()

  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {t('Manage translations')}
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {t('View and edit translation key-value pairs')}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onFindDuplicates}
          disabled={loadingDuplicates}
          className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-600 disabled:opacity-50"
        >
          <Copy className={`h-4 w-4 ${loadingDuplicates ? 'animate-pulse' : ''}`} />
          {loadingDuplicates ? t('Checking...') : t('Find duplicates')}
        </button>
        <button
          onClick={onDownloadJson}
          className="flex items-center gap-1.5 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-600"
        >
          <Download className="h-4 w-4" />
          {t('Download JSON')}
        </button>
        <button
          onClick={onClearCache}
          className="flex items-center gap-1.5 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-yellow-600"
        >
          <Trash2 className="h-4 w-4" />
          {t('Clear cache')}
        </button>
        <button
          onClick={onRegenerateFiles}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all"
          style={{ backgroundColor: 'var(--primary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--primary-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--primary)'
          }}
        >
          <FileCode className="h-4 w-4" />
          {t('Generate properties')}
        </button>
      </div>
    </div>
  )
}
