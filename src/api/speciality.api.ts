// Unified Speciality Classifier API Client (bachelor + master, tree + curation grid)
import apiClient from './client'
import { classifierLabel } from './specialityAttachments.api'
import type { ClassifierOption } from './specialityAttachments.api'

// Re-exported so the classifier feature (dialogs, hooks) depends only on this module for the
// education-type option shape + its locale-aware label, not on the registry attachments module.
export { classifierLabel }
export type { ClassifierOption }

/** Education-type code (hemishe_h_education_type): '11' = Bakalavr, '12' = Magistr. The two
 *  discriminator values this classifier admits (bachelor + master). */
export type EducationTypeCode = '11' | '12'
export type ReviewStatus = 'APPROVED' | 'NEEDS_REVIEW'

/** Flat list row (curation grid). */
export interface SpecialityRow {
  id: string
  code?: string
  nameUz: string
  /** oz-UZ (Uzbek Cyrillic) — the authoritative source script; NULL where the source had none. */
  nameOz?: string
  nameRu?: string
  nameEn?: string
  /** Education-type code — FK into hemishe_h_education_type ('11'=Bakalavr, '12'=Magistr). */
  educationType: string
  /** Resolved education-type label from the classifier (e.g. "Bakalavr" / "Magistr"). */
  educationTypeName?: string
  reviewStatus: ReviewStatus
  parentId?: string
  hierarchyLevel?: number
  active: boolean
  /** Optimistic-lock version — bumps on every edit (OTM cache-bust = SUM(version)). */
  version: number
  years: number[]
}

/** Tree node (hierarchical view) — row fields + nested children. */
export interface SpecialityNode {
  id: string
  code?: string
  nameUz: string
  /** oz-UZ (Uzbek Cyrillic) — the authoritative source script; NULL where the source had none. */
  nameOz?: string
  nameRu?: string
  nameEn?: string
  educationType: string
  educationTypeName?: string
  reviewStatus: ReviewStatus
  parentId?: string
  hierarchyLevel?: number
  active: boolean
  isChecked: boolean
  /** Optimistic-lock version — bumps on every edit (OTM cache-bust = SUM(version)). */
  version: number
  years: number[]
  children: SpecialityNode[]
}

export interface SpecialityUpdatePayload {
  code?: string
  nameUz: string
  /** oz-UZ (Uzbek Cyrillic) — the authoritative source script; NULL where the source had none. */
  nameOz?: string
  nameRu?: string
  nameEn?: string
  /** Education-type code ('11'=Bakalavr, '12'=Magistr). */
  educationType?: EducationTypeCode
  reviewStatus?: ReviewStatus
  /** Target depth (1-4). Omit = leave placement unchanged; when set, drives re-placement + cascade. */
  hierarchyLevel?: number
  /** New parent (null for a level-1 row). Paired with hierarchyLevel; ignored when it is omitted. */
  parentId?: string
  years?: number[]
}

/** Manual-add payload. The new row is born NEEDS_REVIEW server-side; `parentId`
 *  null (or omitted) creates a top-level node, else a child of that parent. */
export interface SpecialityCreatePayload {
  code?: string
  nameUz: string
  /** oz-UZ (Uzbek Cyrillic) — the authoritative source script; NULL where the source had none. */
  nameOz?: string
  nameRu?: string
  nameEn?: string
  /** Education-type code ('11'=Bakalavr, '12'=Magistr) — required for a new row. */
  educationType: EducationTypeCode
  parentId?: string | null
  years?: number[]
}

/** One existing row matching the add form's code/name — element of {@link SpecialityDuplicateCheck}. */
export interface SpecialityDuplicateItem {
  id: string
  code?: string
  nameUz: string
  educationType: string
  educationTypeName?: string
  reviewStatus: ReviewStatus
  hierarchyLevel?: number
  /** Admission years attached to this row (newest first). */
  years?: number[]
  codeMatch: boolean
  nameMatch: boolean
  sameParent: boolean
}

/**
 * "Already exists" result. Code-only / name-only overlaps stay advisory (code is intentionally
 * non-unique). `exactDuplicate` — a literal twin (same type + code + name) already exists — is the
 * one case the form blocks; the create endpoint enforces it too (409).
 */
export interface SpecialityDuplicateCheck {
  codeExists: boolean
  nameExists: boolean
  exactDuplicate: boolean
  matches: SpecialityDuplicateItem[]
}

export interface SpecialityDuplicateParams {
  code?: string
  name?: string
  educationType?: EducationTypeCode
  parentId?: string | null
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface SpecialityListParams {
  educationType?: EducationTypeCode
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
    educationType?: EducationTypeCode,
    signal?: AbortSignal,
  ): Promise<SpecialityNode[]> => {
    const response = await apiClient.get<Wrapped<SpecialityNode[]>>(`${BASE_URL}/tree`, {
      params: { educationType },
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
  years: async (educationType?: EducationTypeCode, signal?: AbortSignal): Promise<number[]> => {
    const response = await apiClient.get<Wrapped<number[]>>(`${BASE_URL}/years`, {
      params: { educationType },
      signal,
    })
    return response.data.data
  },

  /**
   * Education types this classifier admits (Bakalavr/Magistr) from the h_education_type classifier —
   * the Ta'lim turi dropdown source for the Create/Edit dialogs. Served under the classifier's own
   * `classifiers.speciality.view` permission (no cross-feature dependency on speciality-attachments).
   */
  educationTypes: async (signal?: AbortSignal): Promise<ClassifierOption[]> => {
    const response = await apiClient.get<Wrapped<ClassifierOption[]>>(
      `${BASE_URL}/education-types`,
      { signal },
    )
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

  /** Manually add a new speciality (born NEEDS_REVIEW). Returns the created node. */
  create: async (payload: SpecialityCreatePayload): Promise<SpecialityNode> => {
    const response = await apiClient.post<Wrapped<SpecialityNode>>(BASE_URL, payload)
    return response.data.data
  },

  /** Advisory duplicate check for the add form — existing rows with the same code/name. */
  duplicates: async (
    params: SpecialityDuplicateParams,
    signal?: AbortSignal,
  ): Promise<SpecialityDuplicateCheck> => {
    const response = await apiClient.get<Wrapped<SpecialityDuplicateCheck>>(
      `${BASE_URL}/duplicates`,
      {
        params,
        signal,
      },
    )
    return response.data.data
  },

  /**
   * Classifier as a professional .xlsx (provenance band + frozen auto-filtered header +
   * collapsible tree grouping). Every filter is applied with ancestor retention, so a filtered
   * export mirrors the grid; omit all filters for the whole classifier. `lang` localizes labels.
   * Returns the file blob (generated in-memory server-side — no file is persisted).
   */
  exportXlsx: async (opts: {
    educationType?: EducationTypeCode
    year?: number
    reviewStatus?: ReviewStatus
    q?: string
    lang?: string
  }): Promise<Blob> => {
    const response = await apiClient.get(`${BASE_URL}/export`, {
      params: {
        educationType: opts.educationType,
        year: opts.year,
        reviewStatus: opts.reviewStatus,
        q: opts.q,
        lang: opts.lang,
      },
      responseType: 'blob',
    })
    return response.data as Blob
  },
}
