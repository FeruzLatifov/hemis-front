/**
 * Translation Admin Page - Compact Modern Design
 *
 * View and Edit system translations (No Create/Delete)
 * Path: Tizim → Tarjimalar
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  getTranslations,
  toggleTranslationActive,
  clearTranslationCache,
  regeneratePropertiesFiles,
  downloadAllTranslationsAsJson,
  findDuplicateMessages,
  DuplicateGroup,
} from '@/api/translations.api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Search,
  Filter,
  Trash2,
  FileCode,
  Edit,
  Download,
  Copy,
  AlertTriangle,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { extractApiErrorMessage } from '@/utils/error.util'

export default function TranslationsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [searchFilter, setSearchFilter] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>()

  const [showClearCacheModal, setShowClearCacheModal] = useState(false)
  const [showRegenerateModal, setShowRegenerateModal] = useState(false)
  const [showDuplicates, setShowDuplicates] = useState(false)
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([])
  const [loadingDuplicates, setLoadingDuplicates] = useState(false)

  // TanStack Query for translations list
  const {
    data: translationsData,
    isLoading: loading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.translations.list({
      page: currentPage,
      size: pageSize,
      categoryFilter,
      searchFilter,
      activeFilter,
    }),
    queryFn: () =>
      getTranslations({
        category: categoryFilter || undefined,
        search: searchFilter || undefined,
        active: activeFilter,
        page: currentPage,
        size: pageSize,
        sortBy: 'category',
        sortDir: 'ASC',
      }),
  })

  const translations = Array.isArray(translationsData?.content) ? translationsData.content : []
  const totalItems = translationsData?.totalItems ?? 0
  const totalPages = translationsData?.totalPages ?? 0

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: toggleTranslationActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.translations.all })
    },
    onError: (err: unknown) => {
      toast.error(extractApiErrorMessage(err, t('Failed to toggle active status')))
    },
  })

  const handleToggleActive = (id: string) => {
    toggleActiveMutation.mutate(id)
  }

  const handleFindDuplicates = async () => {
    try {
      setLoadingDuplicates(true)
      const result = await findDuplicateMessages()
      setDuplicates(result)
      setShowDuplicates(true)
      if (result.length === 0) {
        toast.success(t('No duplicate translations found'), { duration: 3000 })
      } else {
        toast.warning(`${result.length} ${t('duplicate groups found')}`, { duration: 3000 })
      }
    } catch (err) {
      toast.error(extractApiErrorMessage(err, t('Error checking duplicates')), { duration: 5000 })
    } finally {
      setLoadingDuplicates(false)
    }
  }

  const confirmClearCache = async () => {
    try {
      const result = await clearTranslationCache()
      setShowClearCacheModal(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.translations.all })
      toast.success(result.message || t('Cache cleared successfully'), {
        duration: 3000,
        position: 'bottom-right',
      })
    } catch (err: unknown) {
      // ⭐ Backend-driven i18n: Use backend's localized message
      toast.error(extractApiErrorMessage(err, t('Error clearing cache')), {
        duration: 5000,
        position: 'bottom-right',
      })
    }
  }

  const confirmRegenerateFiles = async () => {
    try {
      const result = await regeneratePropertiesFiles()
      setShowRegenerateModal(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.translations.all })
      toast.success(
        `${result.totalFiles} ${t('files created')} (${result.totalTranslations} ${t('translations')})`,
        {
          duration: 4000,
          position: 'bottom-right',
        },
      )
    } catch (err: unknown) {
      // ⭐ Backend-driven i18n: Use backend's localized message
      toast.error(extractApiErrorMessage(err, t('Error generating properties')), {
        duration: 5000,
        position: 'bottom-right',
      })
    }
  }

  return (
    <div className="flex h-screen flex-col" style={{ backgroundColor: 'var(--app-bg)' }}>
      {/* Sticky Header + Filters */}
      <div
        className="sticky top-0 z-30 shadow-md"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderBottom: '2px solid var(--border-color-pro)',
        }}
      >
        <div className="px-6 py-4">
          {/* Title + Actions */}
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
                onClick={handleFindDuplicates}
                disabled={loadingDuplicates}
                className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-600 disabled:opacity-50"
              >
                <Copy className={`h-4 w-4 ${loadingDuplicates ? 'animate-pulse' : ''}`} />
                {loadingDuplicates ? t('Checking...') : t('Find duplicates')}
              </button>
              <button
                onClick={async () => {
                  try {
                    toast.info(t('JSON files downloading...'), { duration: 2000 })
                    const result = await downloadAllTranslationsAsJson()
                    toast.success(
                      `${result.downloaded.length} ${t('JSON files downloaded')}: ${result.downloaded.join(', ')}`,
                      {
                        duration: 4000,
                        position: 'bottom-right',
                      },
                    )
                  } catch (err) {
                    toast.error(extractApiErrorMessage(err, t('Error downloading JSON')), {
                      duration: 5000,
                    })
                  }
                }}
                className="flex items-center gap-1.5 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-600"
              >
                <Download className="h-4 w-4" />
                {t('Download JSON')}
              </button>
              <button
                onClick={() => setShowClearCacheModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-yellow-600"
              >
                <Trash2 className="h-4 w-4" />
                {t('Clear cache')}
              </button>
              <button
                onClick={() => setShowRegenerateModal(true)}
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

          {/* Filters */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label
                className="mb-1.5 block text-xs font-semibold"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Filter className="mr-1 inline-block h-3 w-3" />
                {t('Category')}
              </label>
              <input
                type="text"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                placeholder={t('menu, button...')}
                className="w-full rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:ring-blue-400 focus:outline-none"
                style={{
                  borderColor: 'var(--border-color-pro)',
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label
                className="mb-1.5 block text-xs font-semibold"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Search className="mr-1 inline-block h-3 w-3" />
                {t('Search')}
              </label>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder={t('Key or text...')}
                className="w-full rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:ring-blue-400 focus:outline-none"
                style={{
                  borderColor: 'var(--border-color-pro)',
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label
                className="mb-1.5 block text-xs font-semibold"
                style={{ color: 'var(--text-secondary)' }}
              >
                {t('Status')}
              </label>
              <select
                value={activeFilter === undefined ? '' : activeFilter ? 'true' : 'false'}
                onChange={(e) =>
                  setActiveFilter(e.target.value === '' ? undefined : e.target.value === 'true')
                }
                className="w-full rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:ring-blue-400 focus:outline-none"
                style={{
                  borderColor: 'var(--border-color-pro)',
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="">{t('All')}</option>
                <option value="true">{t('Active')}</option>
                <option value="false">{t('Inactive')}</option>
              </select>
            </div>
            <div>
              <label
                className="mb-1.5 block text-xs font-semibold"
                style={{ color: 'var(--text-secondary)' }}
              >
                {t('Show')}
              </label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(0)
                }}
                className="w-full rounded-lg border px-3 py-2 text-sm font-semibold transition-all focus:ring-2 focus:ring-blue-400 focus:outline-none"
                style={{
                  borderColor: 'var(--border-color-pro)',
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Duplicates Panel */}
      {showDuplicates && duplicates.length > 0 && (
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
                onClick={() => setShowDuplicates(false)}
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
      )}

      {/* Table Container with Scrollable Body */}
      <div className="flex-1 overflow-hidden px-6 py-4">
        <div
          className="flex h-full flex-col overflow-hidden rounded-lg border shadow-lg"
          style={{
            borderColor: 'var(--border-color-pro)',
            backgroundColor: 'var(--card-bg)',
          }}
        >
          {loading ? (
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
          ) : isError ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="font-semibold" style={{ color: 'var(--danger)' }}>
                {t('Error')}: {(error as Error)?.message || t('Failed to load translations')}
              </p>
            </div>
          ) : translations.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {t('No translations found')}
              </p>
            </div>
          ) : (
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
                      <tr
                        key={translation.id}
                        className="border-b transition-colors"
                        style={{
                          borderColor: 'var(--border-color-pro)',
                          backgroundColor:
                            index % 2 === 0 ? 'transparent' : 'rgba(102, 126, 234, 0.02)',
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
                            onClick={() => handleToggleActive(translation.id)}
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
                            onClick={() => navigate(`/system/translation/${translation.id}/edit`)}
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
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
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
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-30"
                    style={{
                      borderColor:
                        currentPage >= totalPages - 1
                          ? 'var(--border-color-pro)'
                          : 'var(--primary)',
                      backgroundColor: 'var(--card-bg)',
                      color:
                        currentPage >= totalPages - 1 ? 'var(--text-secondary)' : 'var(--primary)',
                    }}
                  >
                    {t('Next')} →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Clear Cache Modal */}
      <Dialog open={showClearCacheModal} onOpenChange={setShowClearCacheModal}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
              <Trash2 className="h-6 w-6 text-yellow-500" />
              {t('Clear cache')}
            </DialogTitle>
            <DialogDescription className="mt-3 text-base leading-relaxed text-gray-600 dark:text-gray-300">
              {t(
                'Do you want to clear translations cache? This will force reload translations from backend.',
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 gap-3">
            <button
              onClick={() => setShowClearCacheModal(false)}
              className="rounded-lg border-2 border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50"
            >
              {t('Cancel')}
            </button>
            <button
              onClick={confirmClearCache}
              className="rounded-lg bg-yellow-500 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-yellow-600 hover:shadow-xl"
            >
              {t('Yes, clear')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Properties Modal */}
      <Dialog open={showRegenerateModal} onOpenChange={setShowRegenerateModal}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
              <FileCode className="h-6 w-6" style={{ color: 'var(--primary)' }} />
              {t('Regenerate properties files')}
            </DialogTitle>
            <DialogDescription className="mt-3 text-base leading-relaxed text-gray-600 dark:text-gray-300">
              {t(
                'Do you want to regenerate properties files for all languages? This may take a few seconds.',
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 gap-3">
            <button
              onClick={() => setShowRegenerateModal(false)}
              className="rounded-lg border-2 border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50"
            >
              {t('Cancel')}
            </button>
            <button
              onClick={confirmRegenerateFiles}
              className="rounded-lg px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl"
              style={{ backgroundColor: 'var(--primary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary)'
              }}
            >
              {t('Yes, generate')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
