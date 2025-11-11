/**
 * Translation Admin API Client
 *
 * Backend endpoints: /api/v1/api/v1/web/system/translation
 */

import apiClient from './client';

// =====================================================
// Types
// =====================================================

export interface Translation {
  id: string;
  category: string;
  messageKey: string;
  message: string;  // Uzbek Latin (default)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  // Translations for other languages
  translations?: {
    language: string;
    translation: string;
  }[];
}

export interface TranslationListResponse {
  content: Translation[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
  pageSize: number;
}

export interface TranslationCreateRequest {
  category: string;
  messageKey: string;
  messageUz: string;
  messageOz?: string;
  messageRu?: string;
  messageEn?: string;
  active?: boolean;
}

export interface TranslationUpdateRequest extends TranslationCreateRequest {
}

export interface TranslationStatistics {
  totalMessages: number;
  activeMessages: number;
  inactiveMessages: number;
  totalTranslations: number;
  categoryBreakdown: Record<string, number>;
  languages: string[];
}

export interface ExportRequest {
  language: string;
}

export interface ExportResponse {
  [key: string]: string;  // key-value pairs
}

export interface RegenerateResponse {
  success: boolean;
  generatedFiles: string[];
  totalFiles: number;
  totalTranslations: number;
  timestamp: string;
  errors?: string[];
}

// =====================================================
// API Methods
// =====================================================

/**
 * Get translations list with pagination and filters
 */
export const getTranslations = async (params?: {
  category?: string;
  search?: string;
  active?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}): Promise<TranslationListResponse> => {
  const { data } = await apiClient.get('/api/v1/web/system/translation', { params });

  // Normalize various response shapes to TranslationListResponse
  const normalize = (raw: any): TranslationListResponse => {
    // If backend returns array directly
    if (Array.isArray(raw)) {
      return {
        content: raw as Translation[],
        currentPage: 0,
        totalItems: raw.length,
        totalPages: 1,
        pageSize: raw.length,
      };
    }

    // If wrapped in { data: ... }
    if (raw && typeof raw === 'object' && 'data' in raw) {
      return normalize((raw as any).data);
    }

    // Common paged shapes
    const content: Translation[] = (raw?.content ?? raw?.items ?? []) as Translation[];
    const totalItems: number = raw?.totalItems ?? raw?.total ?? content.length ?? 0;
    const pageSize: number = raw?.pageSize ?? raw?.size ?? (content.length || 0);
    const currentPage: number = raw?.currentPage ?? raw?.page ?? 0;
    const totalPages: number =
      raw?.totalPages ?? (pageSize ? Math.max(1, Math.ceil(totalItems / pageSize)) : 1);

    return {
      content,
      currentPage,
      totalItems,
      totalPages,
      pageSize,
    };
  };

  return normalize(data);
};

/**
 * Get single translation by ID
 */
export const getTranslationById = async (id: string): Promise<Translation> => {
  const response = await apiClient.get(`/api/v1/web/system/translation/${id}`);
  return response.data;
};

/**
 * Update existing translation
 */
export const updateTranslation = async (
  id: string,
  data: TranslationUpdateRequest
): Promise<Translation> => {
  const response = await apiClient.put(`/api/v1/web/system/translation/${id}`, data);
  return response.data;
};

/**
 * Toggle translation active status
 */
export const toggleTranslationActive = async (id: string): Promise<Translation> => {
  const response = await apiClient.patch(`/api/v1/web/system/translation/${id}/toggle-active`);
  return response.data;
};

/**
 * Get translation statistics
 */
export const getTranslationStatistics = async (): Promise<TranslationStatistics> => {
  const response = await apiClient.get('/api/v1/web/system/translation/stats');
  return response.data;
};

/**
 * Clear translation cache
 */
export const clearTranslationCache = async (): Promise<{ message: string }> => {
  const response = await apiClient.post('/api/v1/web/system/translation/cache/clear');
  return response.data;
};

/**
 * Export translations to properties format
 */
export const exportTranslations = async (language: string): Promise<ExportResponse> => {
  const response = await apiClient.post('/api/v1/web/system/translation/export', { language });
  return response.data;
};

/**
 * Regenerate properties files
 */
export const regeneratePropertiesFiles = async (): Promise<RegenerateResponse> => {
  const response = await apiClient.post('/api/v1/web/system/translation/properties/regenerate');
  return response.data;
};
