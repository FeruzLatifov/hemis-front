/**
 * Duplicate Detector Panel
 *
 * Displays duplicate translation entries grouped by message
 */

import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, X, Edit } from 'lucide-react'
import type { DuplicateGroup } from '@/api/translations.api'

interface DuplicateDetectorPanelProps {
  duplicates: DuplicateGroup[]
  onClose: () => void
}

export function DuplicateDetectorPanel({ duplicates, onClose }: DuplicateDetectorPanelProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (duplicates.length === 0) {
    return null
  }

  return (
    <div className="px-6 pt-4">
      <div
        className="overflow-hidden rounded-lg border"
        style={{
          borderColor: 'var(--warning)',
          backgroundColor: '#FFFBEB',
        }}
      >
        {/* Panel Header */}
        <div
          className="flex items-center justify-between border-b px-4 py-3"
          style={{ borderColor: 'var(--warning)', backgroundColor: '#FEF3C7' }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" style={{ color: 'var(--warning)' }} />
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {duplicates.length} {t('duplicate groups found')}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              — {t('translations with same text but different keys')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 transition-colors hover:bg-yellow-200"
            aria-label={t('Close')}
          >
            <X className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Duplicate Groups */}
        <div className="max-h-80 divide-y overflow-auto" style={{ borderColor: '#FDE68A' }}>
          {duplicates.map((group, gi) => (
            <div key={gi} className="px-4 py-3">
              <div
                className="mb-2 text-xs font-semibold"
                style={{ color: 'var(--text-secondary)' }}
              >
                {t('Text')}:{' '}
                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                  "{group.message}"
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.entries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => navigate(`/system/translation/${entry.id}/edit`)}
                    className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                    style={{
                      borderColor: 'var(--border-color-pro)',
                      backgroundColor: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                    }}
                    title={`${t('Category')}: ${entry.category}`}
                  >
                    <span
                      className="rounded px-1.5 py-0.5 text-xs font-bold text-white"
                      style={{ backgroundColor: 'var(--primary)' }}
                    >
                      {entry.category}
                    </span>
                    <span className="font-mono">{entry.messageKey}</span>
                    <Edit className="h-3 w-3" style={{ color: 'var(--text-secondary)' }} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
