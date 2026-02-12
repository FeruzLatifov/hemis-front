/**
 * Translation Admin Page - Compact Modern Design
 *
 * View and Edit system translations (No Create/Delete)
 * Path: Tizim → Tarjimalar
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { type DuplicateGroup } from '@/api/translations.api'
import {
  useTranslations as useTranslationsQuery,
  useToggleTranslationActive,
  useClearTranslationCache,
  useRegeneratePropertiesFiles,
  useFindDuplicateMessages,
  useDownloadTranslationsAsJson,
} from '@/hooks/useTranslations'

import {
  TranslationsHeader,
  TranslationFilters,
  TranslationsTable,
  DuplicateDetectorPanel,
  ClearCacheDialog,
  RegenerateFilesDialog,
} from './components'

export default function TranslationsPage() {
  const { t } = useTranslation()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [searchFilter, setSearchFilter] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>()

  // Modal state
  const [showClearCacheModal, setShowClearCacheModal] = useState(false)
  const [showRegenerateModal, setShowRegenerateModal] = useState(false)

  // Duplicates state
  const [showDuplicates, setShowDuplicates] = useState(false)
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([])

  // TanStack Query for translations list
  const {
    data: translationsData,
    isLoading: loading,
    isError,
    error,
  } = useTranslationsQuery({
    page: currentPage,
    size: pageSize,
    category: categoryFilter,
    search: searchFilter,
    active: activeFilter,
  })

  const translations = Array.isArray(translationsData?.content) ? translationsData.content : []
  const totalItems = translationsData?.totalItems ?? 0
  const totalPages = translationsData?.totalPages ?? 0

  // Mutations
  const toggleActiveMutation = useToggleTranslationActive()
  const clearCacheMutation = useClearTranslationCache()
  const regenerateMutation = useRegeneratePropertiesFiles()
  const findDuplicatesMutation = useFindDuplicateMessages()
  const downloadJsonMutation = useDownloadTranslationsAsJson()

  // Handlers
  const handleToggleActive = useCallback(
    (id: string) => {
      toggleActiveMutation.mutate(id)
    },
    [toggleActiveMutation],
  )

  const handleFindDuplicates = useCallback(() => {
    findDuplicatesMutation.mutate(undefined, {
      onSuccess: (result) => {
        setDuplicates(result)
        setShowDuplicates(true)
        if (result.length === 0) {
          toast.success(t('No duplicate translations found'), { duration: 3000 })
        } else {
          toast.warning(`${result.length} ${t('duplicate groups found')}`, { duration: 3000 })
        }
      },
    })
  }, [findDuplicatesMutation, t])

  const handleDownloadJson = useCallback(() => {
    toast.info(t('JSON files downloading...'), { duration: 2000 })
    downloadJsonMutation.mutate()
  }, [downloadJsonMutation, t])

  const handleClearCache = useCallback(() => {
    clearCacheMutation.mutate(undefined, {
      onSuccess: () => {
        setShowClearCacheModal(false)
      },
    })
  }, [clearCacheMutation])

  const handleRegenerateFiles = useCallback(() => {
    regenerateMutation.mutate(undefined, {
      onSuccess: () => {
        setShowRegenerateModal(false)
      },
    })
  }, [regenerateMutation])

  const handlePageSizeChange = useCallback((value: number) => {
    setPageSize(value)
    setCurrentPage(0)
  }, [])

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
          <TranslationsHeader
            loadingDuplicates={findDuplicatesMutation.isPending}
            onFindDuplicates={handleFindDuplicates}
            onDownloadJson={handleDownloadJson}
            onClearCache={() => setShowClearCacheModal(true)}
            onRegenerateFiles={() => setShowRegenerateModal(true)}
          />

          <TranslationFilters
            categoryFilter={categoryFilter}
            searchFilter={searchFilter}
            activeFilter={activeFilter}
            pageSize={pageSize}
            onCategoryChange={setCategoryFilter}
            onSearchChange={setSearchFilter}
            onActiveChange={setActiveFilter}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      </div>

      {/* Duplicates Panel */}
      {showDuplicates && duplicates.length > 0 && (
        <DuplicateDetectorPanel duplicates={duplicates} onClose={() => setShowDuplicates(false)} />
      )}

      {/* Table Container */}
      <div className="flex-1 overflow-hidden px-6 py-4">
        <div
          className="flex h-full flex-col overflow-hidden rounded-lg border shadow-lg"
          style={{
            borderColor: 'var(--border-color-pro)',
            backgroundColor: 'var(--card-bg)',
          }}
        >
          <TranslationsTable
            translations={translations}
            loading={loading}
            isError={isError}
            error={error as Error | null}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onToggleActive={handleToggleActive}
          />
        </div>
      </div>

      {/* Modals */}
      <ClearCacheDialog
        open={showClearCacheModal}
        onOpenChange={setShowClearCacheModal}
        onConfirm={handleClearCache}
      />

      <RegenerateFilesDialog
        open={showRegenerateModal}
        onOpenChange={setShowRegenerateModal}
        onConfirm={handleRegenerateFiles}
      />
    </div>
  )
}
