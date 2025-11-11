/**
 * Translation API Client
 *
 * Backend endpoints: /api/v1/web/translations
 */

import apiClient from './client';

// =====================================================
// Types
// =====================================================

export interface Translation {
  id: string;
  key: string;
  valueUz: string;
  valueRu?: string;
  valueEn?: string;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TranslationMap {
  [key: string]: string;
}

export interface TranslationResponse {
  success: boolean;
  message: string;
  data: Translation[];
}

export interface TranslationItemResponse {
  success: boolean;
  message: string;
  data: Translation;
}

export interface TranslationMapResponse {
  success: boolean;
  message: string;
  data: TranslationMap;
}

export interface TranslationHealthResponse {
  success: boolean;
  message: string;
  data: {
    status: string;
    total_translations: number;
    complete_translations: number;
    completeness_percentage: number;
  };
}

export interface TranslationStatsResponse {
  success: boolean;
  message: string;
  data: {
    total: number;
    complete: number;
    incomplete: number;
    completeness_percentage: number;
    by_category: { [key: string]: number };
  };
}

export interface CategoriesResponse {
  success: boolean;
  message: string;
  data: string[];
}

// =====================================================
// Public API (All Authenticated Users)
// =====================================================

/**
 * Get all translations for specific language
 *
 * @param lang Language code ('uz', 'oz', 'ru', 'en')
 * @returns Translation map (key → value)
 */
export const getTranslationsByLanguage = async (lang: 'uz' | 'oz' | 'ru' | 'en'): Promise<TranslationMap> => {
  // Map short language codes to BCP-47 full locale codes
  const localeMap: Record<string, string> = {
    'uz': 'uz-UZ',
    'oz': 'oz-UZ',
    'ru': 'ru-RU',
    'en': 'en-US'
  };

  const locale = localeMap[lang] || 'uz-UZ';

  // Use backend i18n API endpoint
  const response = await apiClient.get<TranslationMapResponse>(`/api/v1/web/i18n/messages?lang=${locale}`);
  return response.data.data;
};

/**
 * Health check for translation API
 *
 * @returns Health status
 */
export const getTranslationHealth = async () => {
  const response = await apiClient.get<TranslationHealthResponse>('/api/v1/web/translations/health');
  return response.data.data;
};

// =====================================================
// Admin API (Requires 'admin:translations' permission)
// =====================================================

/**
 * Get all translations
 *
 * @returns List of all translations
 */
export const getAllTranslations = async (): Promise<Translation[]> => {
  const response = await apiClient.get<TranslationResponse>('/api/v1/web/translations');
  return response.data.data;
};

/**
 * Get translation by ID
 *
 * @param id Translation UUID
 * @returns Translation
 */
export const getTranslationById = async (id: string): Promise<Translation> => {
  const response = await apiClient.get<TranslationItemResponse>(`/api/v1/web/translations/${id}`);
  return response.data.data;
};

/**
 * Get translation by key
 *
 * @param key Translation key
 * @returns Translation
 */
export const getTranslationByKey = async (key: string): Promise<Translation> => {
  const response = await apiClient.get<TranslationItemResponse>(`/api/v1/web/translations/key/${key}`);
  return response.data.data;
};

/**
 * Get translations by category
 *
 * @param category Category name
 * @returns List of translations
 */
export const getTranslationsByCategory = async (category: string): Promise<Translation[]> => {
  const response = await apiClient.get<TranslationResponse>(`/api/v1/web/translations/category/${category}`);
  return response.data.data;
};

/**
 * Search translations
 *
 * @param query Search query
 * @param category Optional category filter
 * @returns Search results
 */
export const searchTranslations = async (query: string, category?: string): Promise<Translation[]> => {
  const params = new URLSearchParams({ q: query });
  if (category) {
    params.append('category', category);
  }
  const response = await apiClient.get<TranslationResponse>(`/api/v1/web/translations/search?${params}`);
  return response.data.data;
};

/**
 * Get all categories
 *
 * @returns List of categories
 */
export const getCategories = async (): Promise<string[]> => {
  const response = await apiClient.get<CategoriesResponse>('/api/v1/web/translations/categories');
  return response.data.data;
};

/**
 * Get translation statistics
 *
 * @returns Statistics
 */
export const getTranslationStats = async () => {
  const response = await apiClient.get<TranslationStatsResponse>('/api/v1/web/translations/stats');
  return response.data.data;
};

/**
 * Get incomplete translations
 *
 * @param lang Language to check ('ru' or 'en')
 * @returns List of incomplete translations
 */
export const getIncompleteTranslations = async (lang: 'ru' | 'en'): Promise<Translation[]> => {
  const response = await apiClient.get<TranslationResponse>(`/api/v1/web/translations/incomplete?lang=${lang}`);
  return response.data.data;
};

/**
 * Create new translation
 *
 * @param translation Translation data
 * @returns Created translation
 */
export const createTranslation = async (translation: Partial<Translation>): Promise<Translation> => {
  const response = await apiClient.post<TranslationItemResponse>('/api/v1/web/translations', translation);
  return response.data.data;
};

/**
 * Update translation
 *
 * @param id Translation UUID
 * @param translation Updated data
 * @returns Updated translation
 */
export const updateTranslation = async (id: string, translation: Partial<Translation>): Promise<Translation> => {
  const response = await apiClient.put<TranslationItemResponse>(`/api/v1/web/translations/${id}`, translation);
  return response.data.data;
};

/**
 * Delete translation (soft delete)
 *
 * @param id Translation UUID
 */
export const deleteTranslation = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v1/web/translations/${id}`);
};

// =====================================================
// Helper Functions
// =====================================================

/**
 * Extract category from translation key
 *
 * @param key Translation key (e.g., 'button.save')
 * @returns Category (e.g., 'button')
 */
export const extractCategory = (key: string): string => {
  return key.split('.')[0];
};

/**
 * Group translations by category
 *
 * @param translations List of translations
 * @returns Translations grouped by category
 */
export const groupByCategory = (translations: Translation[]): { [category: string]: Translation[] } => {
  return translations.reduce((acc, translation) => {
    const category = translation.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(translation);
    return acc;
  }, {} as { [category: string]: Translation[] });
};
