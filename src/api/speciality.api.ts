// Unified Speciality Classifier API Client (bachelor + master, tree + curation grid)
import apiClient from './client'

export type EducationLevel = 'BACHELOR' | 'MASTER'
export type ReviewStatus = 'APPROVED' | 'NEEDS_REVIEW'

/** Flat list row (curation grid). */
export interface SpecialityRow {
  id: string
  code?: string
  nameUz: string
  nameRu?: string
  nameEn?: string
  educationLevel: EducationLevel
  reviewStatus: ReviewStatus
  parentId?: string
  hierarchyLevel?: number
  eduForm?: string
  active: boolean
  years: number[]
}

/** Tree node (hierarchical view) — row fields + nested children. */
export interface SpecialityNode {
  id: string
  code?: string
  nameUz: string
  nameRu?: string
  nameEn?: string
  educationLevel: EducationLevel
  reviewStatus: ReviewStatus
  parentId?: string
  hierarchyLevel?: number
  eduForm?: string
  active: boolean
  isChecked: boolean
  years: number[]
  children: SpecialityNode[]
}

export interface SpecialityUpdatePayload {
  code?: string
  nameUz: string
  nameRu?: string
  nameEn?: string
  educationLevel?: EducationLevel
  reviewStatus?: ReviewStatus
  eduForm?: string
  years?: number[]
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface SpecialityListParams {
  educationLevel?: EducationLevel
  reviewStatus?: ReviewStatus
  q?: string
  /** Keep only rows carrying this edition year. */
  year?: number
  page?: number
  size?: number
  sort?: string
}

type Wrapped<T> = { success: boolean; data: T }

const BASE_URL = '/api/v1/web/classifiers/speciality'

export const specialityApi = {
  tree: async (
    educationLevel?: EducationLevel,
    signal?: AbortSignal,
  ): Promise<SpecialityNode[]> => {
    const response = await apiClient.get<Wrapped<SpecialityNode[]>>(`${BASE_URL}/tree`, {
      params: { educationLevel },
      signal,
    })
    return response.data.data
  },

  list: async (
    params: SpecialityListParams,
    signal?: AbortSignal,
  ): Promise<PageResponse<SpecialityRow>> => {
    const response = await apiClient.get<Wrapped<PageResponse<SpecialityRow>>>(BASE_URL, {
      params,
      signal,
    })
    return response.data.data
  },

  /** Distinct edition years present in the classifier (newest first) — year-filter options. */
  years: async (educationLevel?: EducationLevel, signal?: AbortSignal): Promise<number[]> => {
    const response = await apiClient.get<Wrapped<number[]>>(`${BASE_URL}/years`, {
      params: { educationLevel },
      signal,
    })
    return response.data.data
  },

  getById: async (id: string, signal?: AbortSignal): Promise<SpecialityNode> => {
    const response = await apiClient.get<Wrapped<SpecialityNode>>(`${BASE_URL}/${id}`, { signal })
    return response.data.data
  },

  update: async (id: string, payload: SpecialityUpdatePayload): Promise<SpecialityNode> => {
    const response = await apiClient.put<Wrapped<SpecialityNode>>(`${BASE_URL}/${id}`, payload)
    return response.data.data
  },

  /**
   * Full classifier for one level as an .xlsx (tree order); returns the file blob.
   * When {@code year} is supplied the workbook is pruned to that edition, matching the filtered view.
   */
  exportXlsx: async (educationLevel?: EducationLevel, year?: number): Promise<Blob> => {
    const response = await apiClient.get(`${BASE_URL}/export`, {
      params: { educationLevel, year },
      responseType: 'blob',
    })
    return response.data as Blob
  },
}
