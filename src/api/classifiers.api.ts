import apiClient from './client'

// =====================================================
// Types
// =====================================================

export interface ClassifierCategory {
  key: string
  titleUz: string
  titleRu: string
  titleEn: string
  classifierCount: number
}

export interface ClassifierMetadata {
  apiKey: string
  tableName: string
  titleUz: string
  titleRu: string
  titleEn: string
  category: string
  itemCount: number
  editable: boolean
  hierarchical: boolean
}

export interface ClassifierItem {
  code: string
  name: string
  nameRu?: string
  nameEn?: string
  active?: boolean
  version?: number
  parentCode?: string
  createTs?: string
  updateTs?: string
}

export interface ClassifierItemCreate {
  code: string
  name: string
  nameRu?: string
  nameEn?: string
  active?: boolean
}

export interface ClassifierItemUpdate {
  name?: string
  nameRu?: string
  nameEn?: string
  active?: boolean
}

export interface PagedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface ClassifierItemsParams {
  page?: number
  size?: number
  search?: string
}

// =====================================================
// API
// =====================================================

export const classifiersApi = {
  async getCategories(signal?: AbortSignal): Promise<ClassifierCategory[]> {
    const response = await apiClient.get<{
      success: boolean
      data: ClassifierCategory[]
    }>('/api/v1/web/classifiers/categories', { signal })
    return response.data.data
  },

  async getClassifiersByCategory(
    category: string,
    signal?: AbortSignal,
  ): Promise<ClassifierMetadata[]> {
    const response = await apiClient.get<{
      success: boolean
      data: ClassifierMetadata[]
    }>(`/api/v1/web/classifiers/categories/${category}`, { signal })
    return response.data.data
  },

  async getClassifierItems(
    apiKey: string,
    params: ClassifierItemsParams = {},
    signal?: AbortSignal,
  ): Promise<PagedResponse<ClassifierItem>> {
    const response = await apiClient.get<{
      success: boolean
      data: PagedResponse<ClassifierItem>
    }>(`/api/v1/web/classifiers/${apiKey}`, { params, signal })
    return response.data.data
  },

  async getClassifierItem(
    apiKey: string,
    code: string,
    signal?: AbortSignal,
  ): Promise<ClassifierItem> {
    const response = await apiClient.get<{
      success: boolean
      data: ClassifierItem
    }>(`/api/v1/web/classifiers/${apiKey}/${code}`, { signal })
    return response.data.data
  },

  async createClassifierItem(apiKey: string, data: ClassifierItemCreate): Promise<ClassifierItem> {
    const response = await apiClient.post<{
      success: boolean
      data: ClassifierItem
    }>(`/api/v1/web/classifiers/${apiKey}`, data)
    return response.data.data
  },

  async updateClassifierItem(
    apiKey: string,
    code: string,
    data: ClassifierItemUpdate,
  ): Promise<ClassifierItem> {
    const response = await apiClient.put<{
      success: boolean
      data: ClassifierItem
    }>(`/api/v1/web/classifiers/${apiKey}/${code}`, data)
    return response.data.data
  },

  async deleteClassifierItem(apiKey: string, code: string): Promise<void> {
    await apiClient.delete(`/api/v1/web/classifiers/${apiKey}/${code}`)
  },
}
