/**
 * Translation Admin API Client
 *
 * Backend endpoints: /api/v1/api/v1/web/system/translation
 */

import apiClient from './client'

// =====================================================
// Types
// =====================================================

export interface Translation {
  id: string
  category: string
  messageKey: string
  message: string // Uzbek Latin (default)
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt?: string
  // Translations for other languages
  translations?: {
    language: string
    translation: string
  }[]
}

export interface TranslationListResponse {
  content: Translation[]
  currentPage: number
  totalItems: number
  totalPages: number
  pageSize: number
}

export interface TranslationCreateRequest {
  category: string
  messageKey: string
  messageUz: string
  messageOz?: string
  messageRu?: string
  messageEn?: string
  active?: boolean
}

export type TranslationUpdateRequest = TranslationCreateRequest

export interface TranslationStatistics {
  totalMessages: number
  activeMessages: number
  inactiveMessages: number
  totalTranslations: number
  categoryBreakdown: Record<string, number>
  languages: string[]
}

export interface ExportRequest {
  language: string
}

export interface ExportResponse {
  [key: string]: string // key-value pairs
}

export interface RegenerateResponse {
  success: boolean
  generatedFiles: string[]
  totalFiles: number
  totalTranslations: number
  timestamp: string
  errors?: string[]
}

// =====================================================
// API Methods
// =====================================================

/**
 * Get translations list with pagination and filters
 */
export const getTranslations = async (params?: {
  category?: string
  search?: string
  active?: boolean
  page?: number
  size?: number
  sortBy?: string
  sortDir?: string
}): Promise<TranslationListResponse> => {
  const { data } = await apiClient.get('/api/v1/web/system/translation', { params })

  // Normalize various response shapes to TranslationListResponse
  const normalize = (raw: unknown): TranslationListResponse => {
    // If backend returns array directly
    if (Array.isArray(raw)) {
      return {
        content: raw as Translation[],
        currentPage: 0,
        totalItems: raw.length,
        totalPages: 1,
        pageSize: raw.length,
      }
    }

    // If wrapped in { data: ... }
    if (raw && typeof raw === 'object' && 'data' in raw) {
      return normalize((raw as Record<string, unknown>).data)
    }

    // Common paged shapes
    const rawObj = raw as Record<string, unknown>
    const content: Translation[] = (rawObj?.content ?? rawObj?.items ?? []) as Translation[]
    const totalItems: number = (rawObj?.totalItems ?? rawObj?.total ?? content.length) as number
    const pageSize: number = (rawObj?.pageSize ?? rawObj?.size ?? content.length) as number
    const currentPage: number = (rawObj?.currentPage ?? rawObj?.page ?? 0) as number
    const totalPages: number = (rawObj?.totalPages ??
      (pageSize ? Math.max(1, Math.ceil(totalItems / pageSize)) : 1)) as number

    return {
      content,
      currentPage,
      totalItems,
      totalPages,
      pageSize,
    }
  }

  return normalize(data)
}

/**
 * Get single translation by ID
 */
export const getTranslationById = async (id: string): Promise<Translation> => {
  const response = await apiClient.get(`/api/v1/web/system/translation/${id}`)
  return response.data
}

/**
 * Update existing translation
 */
export const updateTranslation = async (
  id: string,
  data: TranslationUpdateRequest,
): Promise<Translation> => {
  const response = await apiClient.put(`/api/v1/web/system/translation/${id}`, data)
  return response.data
}

/**
 * Toggle translation active status
 */
export const toggleTranslationActive = async (id: string): Promise<Translation> => {
  const response = await apiClient.patch(`/api/v1/web/system/translation/${id}/toggle-active`)
  return response.data
}

/**
 * Get translation statistics
 */
export const getTranslationStatistics = async (): Promise<TranslationStatistics> => {
  const response = await apiClient.get('/api/v1/web/system/translation/stats')
  return response.data
}

/**
 * Clear translation cache
 */
export const clearTranslationCache = async (): Promise<{ message: string }> => {
  const response = await apiClient.post('/api/v1/web/system/translation/cache/clear')
  return response.data
}

/**
 * Export translations to properties format
 */
export const exportTranslations = async (language: string): Promise<ExportResponse> => {
  const response = await apiClient.post('/api/v1/web/system/translation/export', undefined, {
    params: { language },
  })
  return response.data
}

/**
 * Regenerate properties files
 */
export const regeneratePropertiesFiles = async (): Promise<RegenerateResponse> => {
  const response = await apiClient.post('/api/v1/web/system/translation/properties/regenerate')
  return response.data
}

/**
 * Find duplicate translations (same message text, different keys)
 * Fetches all translations and groups by identical message values
 */
export interface DuplicateGroup {
  message: string
  entries: Pick<Translation, 'id' | 'category' | 'messageKey' | 'message' | 'isActive'>[]
}

export const findDuplicateMessages = async (): Promise<DuplicateGroup[]> => {
  // Fetch all translations in one large batch
  const response = await getTranslations({ size: 5000, sortBy: 'messageKey', sortDir: 'ASC' })
  const all = response.content

  // Group by normalized message text (trimmed, lowercased)
  const groups = new Map<string, typeof all>()
  for (const t of all) {
    const key = t.message.trim().toLowerCase()
    if (!key) continue
    const group = groups.get(key) || []
    group.push(t)
    groups.set(key, group)
  }

  // Return only groups with 2+ entries (actual duplicates)
  const duplicates: DuplicateGroup[] = []
  for (const [, entries] of groups) {
    if (entries.length >= 2) {
      duplicates.push({
        message: entries[0].message,
        entries: entries.map(({ id, category, messageKey, message, isActive }) => ({
          id,
          category,
          messageKey,
          message,
          isActive,
        })),
      })
    }
  }

  // Sort by number of duplicates (most first)
  duplicates.sort((a, b) => b.entries.length - a.entries.length)
  return duplicates
}

/**
 * Search translations by message text (for duplicate detection during editing)
 */
export const searchByMessageText = async (text: string): Promise<Translation[]> => {
  if (!text || text.trim().length < 3) return []
  const response = await getTranslations({ search: text.trim(), size: 10 })
  return response.content
}

/**
 * Download translations as JSON file for a specific language
 * This generates a file that can be used in frontend i18n
 */
export const downloadTranslationsAsJson = async (language: string): Promise<void> => {
  const translations = await exportTranslations(language)

  // Convert flat keys to nested object (e.g., "login.title" -> { login: { title: ... } })
  const nested: Record<string, unknown> = {}

  Object.entries(translations).forEach(([key, value]) => {
    const parts = key.split('.')
    let current: Record<string, unknown> = nested

    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current)) {
        current[parts[i]] = {}
      }
      current = current[parts[i]] as Record<string, unknown>
    }

    current[parts[parts.length - 1]] = value
  })

  // Create and download file
  const blob = new Blob([JSON.stringify(nested, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${language}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Download all language translations as separate JSON files
 */
export const downloadAllTranslationsAsJson = async (): Promise<{ downloaded: string[] }> => {
  const languages = ['uz', 'oz', 'ru', 'en']
  const downloaded: string[] = []

  for (const lang of languages) {
    try {
      await downloadTranslationsAsJson(lang)
      downloaded.push(lang)
      // Small delay between downloads
      await new Promise((resolve) => setTimeout(resolve, 500))
    } catch {
      // Skip failed language downloads silently
    }
  }

  return { downloaded }
}
