import { useState, useCallback, useRef, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n/config'
import { Search, Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import {
  useClassifiersByCategory,
  useClassifierItems,
  useCreateClassifierItem,
  useUpdateClassifierItem,
  useDeleteClassifierItem,
} from '@/hooks/useClassifiers'
import { DataTablePagination } from '@/components/tables/DataTablePagination'
import { PAGINATION, UI } from '@/constants'
import type { ClassifierItem, ClassifierMetadata } from '@/api/classifiers.api'

function formatDateTime(dateString?: string): string {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(i18n.language, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function ClassifierCategoryPage() {
  const { t } = useTranslation()
  const { category } = useParams<{ category: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  // Selected classifier from the category list
  const selectedApiKey = searchParams.get('cls') || ''
  const currentPage = Math.max(0, parseInt(searchParams.get('page') || '0', 10) || 0)
  const pageSize = Math.max(
    1,
    Math.min(
      PAGINATION.MAX_PAGE_SIZE,
      parseInt(searchParams.get('size') || String(PAGINATION.EXPANDED_PAGE_SIZE), 10) ||
        PAGINATION.EXPANDED_PAGE_SIZE,
    ),
  )
  const searchFromUrl = (searchParams.get('q') || '').slice(0, 200)

  // Local state
  const [searchInput, setSearchInput] = useState(searchFromUrl)
  const [debouncedSearch, setDebouncedSearch] = useState(searchFromUrl)
  const [editingItem, setEditingItem] = useState<ClassifierItem | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState({
    code: '',
    name: '',
    nameRu: '',
    nameEn: '',
    active: true,
  })
  const [editForm, setEditForm] = useState({ name: '', nameRu: '', nameEn: '', active: true })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateSearchParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        Object.entries(updates).forEach(([key, value]) => {
          if (value !== undefined) {
            next.set(key, value)
          } else {
            next.delete(key)
          }
        })
        return next
      })
    },
    [setSearchParams],
  )

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchInput)
      updateSearchParams({ q: searchInput || undefined, page: undefined })
    }, UI.SEARCH_DEBOUNCE)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [searchInput, updateSearchParams])

  // Queries
  const { data: classifiers, isLoading: isLoadingClassifiers } = useClassifiersByCategory(
    category || '',
  )

  const { data: itemsData, isLoading: isLoadingItems } = useClassifierItems(selectedApiKey, {
    page: currentPage,
    size: pageSize,
    search: debouncedSearch || undefined,
  })

  // Mutations
  const createMutation = useCreateClassifierItem(selectedApiKey)
  const updateMutation = useUpdateClassifierItem(selectedApiKey)
  const deleteMutation = useDeleteClassifierItem(selectedApiKey)

  // Selected classifier metadata
  const selectedClassifier = classifiers?.find(
    (c: ClassifierMetadata) => c.apiKey === selectedApiKey,
  )

  // Auto-select first classifier
  useEffect(() => {
    if (classifiers && classifiers.length > 0 && !selectedApiKey) {
      updateSearchParams({ cls: classifiers[0].apiKey })
    }
  }, [classifiers, selectedApiKey, updateSearchParams])

  const handleSelectClassifier = useCallback(
    (apiKey: string) => {
      updateSearchParams({ cls: apiKey, page: undefined, q: undefined })
      setSearchInput('')
      setDebouncedSearch('')
      setShowCreateForm(false)
      setEditingItem(null)
    },
    [updateSearchParams],
  )

  const handleCreate = useCallback(() => {
    if (!createForm.code.trim()) {
      toast.error(t('This field is required') + ': ' + t('Code'))
      return
    }
    createMutation.mutate(
      {
        code: createForm.code.trim(),
        name: createForm.name.trim(),
        nameRu: createForm.nameRu.trim() || undefined,
        nameEn: createForm.nameEn.trim() || undefined,
        active: createForm.active,
      },
      {
        onSuccess: () => {
          setShowCreateForm(false)
          setCreateForm({ code: '', name: '', nameRu: '', nameEn: '', active: true })
        },
      },
    )
  }, [createForm, createMutation, t])

  const handleUpdate = useCallback(() => {
    if (!editingItem) return
    updateMutation.mutate(
      {
        code: editingItem.code,
        data: {
          name: editForm.name.trim() || undefined,
          nameRu: editForm.nameRu.trim() || undefined,
          nameEn: editForm.nameEn.trim() || undefined,
          active: editForm.active,
        },
      },
      {
        onSuccess: () => setEditingItem(null),
      },
    )
  }, [editingItem, editForm, updateMutation])

  const handleDelete = useCallback(
    (code: string) => {
      deleteMutation.mutate(code, {
        onSuccess: () => setDeleteConfirm(null),
      })
    },
    [deleteMutation],
  )

  const startEdit = useCallback((item: ClassifierItem) => {
    setEditingItem(item)
    setEditForm({
      name: item.name || '',
      nameRu: item.nameRu || '',
      nameEn: item.nameEn || '',
      active: item.active !== false,
    })
    setShowCreateForm(false)
  }, [])

  const items = itemsData?.content ?? []
  const totalElements = itemsData?.totalElements ?? 0
  const totalPages = itemsData?.totalPages ?? 0

  const colCount = selectedClassifier?.editable ? 8 : 7

  return (
    <div className="flex h-full flex-col p-4">
      {/* Top — classifier tabs (horizontal scrollable) */}
      <div className="mb-4 rounded-lg border border-[var(--border-color-pro)] bg-[var(--card-bg)]">
        <div className="flex flex-wrap gap-1 p-1.5">
          {isLoadingClassifiers ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 w-32 animate-pulse rounded-md bg-[var(--hover-bg)]" />
            ))
          ) : classifiers && classifiers.length > 0 ? (
            classifiers.map((cls: ClassifierMetadata) => (
              <button
                key={cls.apiKey}
                onClick={() => handleSelectClassifier(cls.apiKey)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                  selectedApiKey === cls.apiKey
                    ? 'bg-blue-600 font-medium text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
                }`}
              >
                <span className="whitespace-nowrap">{cls.titleUz}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs ${
                    selectedApiKey === cls.apiKey
                      ? 'bg-blue-500 text-blue-100'
                      : 'bg-[var(--hover-bg)] text-[var(--text-secondary)]'
                  }`}
                >
                  {cls.itemCount}
                </span>
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-[var(--text-secondary)]">{t('No data found')}</p>
          )}
        </div>
      </div>

      {/* Content — table area */}
      {selectedClassifier ? (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {selectedClassifier.titleUz}
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {selectedClassifier.tableName}
                {selectedClassifier.hierarchical && (
                  <span className="ml-2 rounded bg-purple-50 px-1.5 py-0.5 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                    {t('Hierarchical')}
                  </span>
                )}
                {!selectedClassifier.editable && (
                  <span className="ml-2 rounded bg-[var(--badge-muted-bg)] px-1.5 py-0.5 text-[var(--badge-muted-text)]">
                    {t('Read only')}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  placeholder={t('Search...')}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="h-9 w-56 rounded-lg border border-[var(--border-color-pro)] bg-[var(--card-bg)] pr-3 pl-8 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              {/* Add button */}
              {selectedClassifier.editable && (
                <button
                  onClick={() => {
                    setShowCreateForm(true)
                    setEditingItem(null)
                    setCreateForm({ code: '', name: '', nameRu: '', nameEn: '', active: true })
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  {t('Add')}
                </button>
              )}
            </div>
          </div>

          {/* Create modal */}
          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {t('Add')} — {selectedClassifier.titleUz}
                </DialogTitle>
                <DialogDescription>{selectedClassifier.tableName}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                    {t('Code')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={createForm.code}
                    onChange={(e) => setCreateForm((p) => ({ ...p, code: e.target.value }))}
                    placeholder={t('Code')}
                    className="w-full rounded-md border border-[var(--border-color-pro)] bg-[var(--input-bg)] px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                    {t('Name')}
                  </label>
                  <input
                    value={createForm.name}
                    onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder={t('Name')}
                    className="w-full rounded-md border border-[var(--border-color-pro)] bg-[var(--input-bg)] px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                      {t('Name (Russian)')}
                    </label>
                    <input
                      value={createForm.nameRu}
                      onChange={(e) => setCreateForm((p) => ({ ...p, nameRu: e.target.value }))}
                      placeholder={t('Name (Russian)')}
                      className="w-full rounded-md border border-[var(--border-color-pro)] bg-[var(--input-bg)] px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                      {t('Name (English)')}
                    </label>
                    <input
                      value={createForm.nameEn}
                      onChange={(e) => setCreateForm((p) => ({ ...p, nameEn: e.target.value }))}
                      placeholder={t('Name (English)')}
                      className="w-full rounded-md border border-[var(--border-color-pro)] bg-[var(--input-bg)] px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-md border border-[var(--border-color-pro)] px-3 py-2.5">
                  <label className="text-sm font-medium text-[var(--text-primary)]">
                    {t('Status')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setCreateForm((p) => ({ ...p, active: !p.active }))}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      createForm.active
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-[var(--hover-bg)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {createForm.active ? t('Active') : t('Inactive')}
                  </button>
                </div>
              </div>
              <DialogFooter>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="inline-flex h-9 items-center rounded-md border border-[var(--border-color-pro)] bg-[var(--card-bg)] px-4 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
                >
                  {t('Cancel')}
                </button>
                <button
                  onClick={handleCreate}
                  disabled={createMutation.isPending || !createForm.code.trim()}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createMutation.isPending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {t('Save')}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit modal */}
          <Dialog
            open={editingItem !== null}
            onOpenChange={(open) => {
              if (!open) setEditingItem(null)
            }}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {t('Edit')} — {editingItem?.code}
                </DialogTitle>
                <DialogDescription>{selectedClassifier.titleUz}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                    {t('Code')}
                  </label>
                  <input
                    value={editingItem?.code ?? ''}
                    disabled
                    className="w-full rounded-md border border-[var(--border-color-pro)] bg-[var(--table-row-alt)] px-3 py-2 text-sm text-[var(--text-secondary)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                    {t('Name')}
                  </label>
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder={t('Name')}
                    className="w-full rounded-md border border-[var(--border-color-pro)] bg-[var(--input-bg)] px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                      {t('Name (Russian)')}
                    </label>
                    <input
                      value={editForm.nameRu}
                      onChange={(e) => setEditForm((p) => ({ ...p, nameRu: e.target.value }))}
                      placeholder={t('Name (Russian)')}
                      className="w-full rounded-md border border-[var(--border-color-pro)] bg-[var(--input-bg)] px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                      {t('Name (English)')}
                    </label>
                    <input
                      value={editForm.nameEn}
                      onChange={(e) => setEditForm((p) => ({ ...p, nameEn: e.target.value }))}
                      placeholder={t('Name (English)')}
                      className="w-full rounded-md border border-[var(--border-color-pro)] bg-[var(--input-bg)] px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-md border border-[var(--border-color-pro)] px-3 py-2.5">
                  <label className="text-sm font-medium text-[var(--text-primary)]">
                    {t('Status')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditForm((p) => ({ ...p, active: !p.active }))}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      editForm.active
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-[var(--hover-bg)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {editForm.active ? t('Active') : t('Inactive')}
                  </button>
                </div>
              </div>
              <DialogFooter>
                <button
                  onClick={() => setEditingItem(null)}
                  className="inline-flex h-9 items-center rounded-md border border-[var(--border-color-pro)] bg-[var(--card-bg)] px-4 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
                >
                  {t('Cancel')}
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={updateMutation.isPending}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updateMutation.isPending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Pencil className="h-4 w-4" />
                  )}
                  {t('Save')}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Table */}
          <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-[var(--border-color-pro)] bg-[var(--card-bg)]">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-[var(--border-color-pro)] bg-[var(--table-header-bg)]">
                  <th className="px-3 py-2.5 text-left text-xs font-medium tracking-wider text-[var(--text-secondary)] uppercase">
                    {t('Code')}
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium tracking-wider text-[var(--text-secondary)] uppercase">
                    {t('Name')}
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium tracking-wider text-[var(--text-secondary)] uppercase">
                    {t('Name (Russian)')}
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium tracking-wider text-[var(--text-secondary)] uppercase">
                    {t('Name (English)')}
                  </th>
                  <th className="px-3 py-2.5 text-center text-xs font-medium tracking-wider text-[var(--text-secondary)] uppercase">
                    {t('Version')}
                  </th>
                  <th className="px-3 py-2.5 text-center text-xs font-medium tracking-wider text-[var(--text-secondary)] uppercase">
                    {t('Status')}
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium tracking-wider text-[var(--text-secondary)] uppercase">
                    {t('Updated at')}
                  </th>
                  {selectedClassifier.editable && (
                    <th className="w-20 px-3 py-2.5 text-right text-xs font-medium tracking-wider text-[var(--text-secondary)] uppercase">
                      {t('Actions')}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color-pro)]">
                {isLoadingItems ? (
                  Array.from({ length: Math.min(pageSize, 10) }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: colCount }).map((_, j) => (
                        <td key={j} className="px-3 py-2.5">
                          <div className="h-4 w-full max-w-24 animate-pulse rounded bg-[var(--border-color-pro)]" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={colCount}
                      className="px-4 py-12 text-center text-sm text-[var(--text-secondary)]"
                    >
                      {t('No data found')}
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.code} className="hover:bg-[var(--hover-bg)]">
                      <td className="px-3 py-2 font-mono text-sm text-[var(--text-primary)]">
                        {item.code}
                      </td>
                      <td className="px-3 py-2 text-sm text-[var(--text-primary)]">
                        {item.name || '—'}
                      </td>
                      <td className="px-3 py-2 text-sm text-[var(--text-secondary)]">
                        {item.nameRu || '—'}
                      </td>
                      <td className="px-3 py-2 text-sm text-[var(--text-secondary)]">
                        {item.nameEn || '—'}
                      </td>
                      <td className="px-3 py-2 text-center text-sm text-[var(--text-secondary)]">
                        {item.version ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            item.active !== false
                              ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-[var(--hover-bg)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {item.active !== false ? t('Active') : t('Inactive')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs whitespace-nowrap text-[var(--text-secondary)]">
                        {formatDateTime(item.updateTs || item.createTs)}
                      </td>
                      {selectedClassifier.editable && (
                        <td className="px-3 py-2 text-right">
                          <div className="flex justify-end gap-0.5">
                            <button
                              onClick={() => startEdit(item)}
                              className="rounded p-1 text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-blue-600"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(item.code)}
                              className="rounded p-1 text-[var(--text-secondary)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Delete confirmation modal */}
          <AlertDialog
            open={deleteConfirm !== null}
            onOpenChange={(open) => {
              if (!open) setDeleteConfirm(null)
            }}
          >
            <AlertDialogContent className="sm:max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle>{t('Delete')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('Are you sure?')} — {deleteConfirm}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirm(null)}>
                  {t('Cancel')}
                </AlertDialogCancel>
                <button
                  onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                  disabled={deleteMutation.isPending}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleteMutation.isPending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {t('Delete')}
                </button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Pagination */}
          {totalElements > 0 && (
            <DataTablePagination
              page={currentPage}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={pageSize}
              onPageChange={(page) =>
                updateSearchParams({ page: page > 0 ? String(page) : undefined })
              }
              onPageSizeChange={(size) =>
                updateSearchParams({ size: String(size), page: undefined })
              }
            />
          )}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-[var(--text-secondary)]">
            {isLoadingClassifiers ? t('Loading...') : t('No data found')}
          </p>
        </div>
      )}
    </div>
  )
}
