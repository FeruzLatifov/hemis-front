// Speciality → OTM Attachment Registry API Client (MODERN h_speciality_attachment)
//
// Read-only review surface for the unified-classifier speciality attachments
// (V019 h_speciality_attachment, 2026-2027 data seeded by backend S018). Distinct
// from the CUBA-legacy `attached-specialities` card. ResponseWrapper `{ success, data }`
// envelope, apiClient only — never direct axios/fetch.
import apiClient from './client'

export interface SpecialityAttachmentRow {
  readonly id: string
  readonly universityCode: string
  readonly universityName?: string | null
  readonly specialityId: string
  readonly specialityCode?: string | null
  readonly specialityName?: string | null
  /** h_speciality taxonomy depth: 3 = Yo'nalish, 4 = Ichki yo'nalish. */
  readonly hierarchyLevel?: number | null
  /** Parent speciality (the direction a sub-direction belongs to); null for a root/direction. */
  readonly parentName?: string | null
  /** Code (Shifr) of the parent speciality — shown next to parentName; null for a root/direction. */
  readonly parentCode?: string | null
  readonly educationType?: string | null
  readonly educationTypeName?: string | null
  readonly educationForm?: string | null
  readonly educationFormName?: string | null
  /** Academic year of the assignment (2026 = 2026-2027). */
  readonly eduYear?: number | null
  readonly status: string
}

export interface SpecialityAttachmentsParams {
  page?: number
  size?: number
  sort?: string
  universityCode?: string
  specialityId?: string
  status?: string
  educationType?: string
  educationForm?: string
  /** Academic year (start year, e.g. 2026 = 2026-2027). */
  eduYear?: number
}

/** One filter-dropdown option (only values present in attachments). */
export interface AttachmentFilterOption {
  readonly code: string
  readonly name: string
}

/** Filter-dropdown sources — only OTMs / types / forms that actually occur in attachments. */
export interface SpecialityAttachmentFilterOptions {
  readonly universities: AttachmentFilterOption[]
  readonly educationTypes: AttachmentFilterOption[]
  readonly educationForms: AttachmentFilterOption[]
  /** Academic years present in attachments — code = start year ("2026"), name = span ("2026-2027"). */
  readonly years: AttachmentFilterOption[]
}

/** One classifier option (code + multilingual name) from a modern h_* reference table. */
export interface ClassifierOption {
  readonly code: string
  readonly name: string
  readonly nameRu?: string | null
  readonly nameEn?: string | null
}

/** Locale-aware display label for a classifier option (falls back to the uz name). */
export function classifierLabel(f: ClassifierOption, lang?: string): string {
  if (lang?.startsWith('ru')) return f.nameRu || f.name
  if (lang?.startsWith('en')) return f.nameEn || f.name
  return f.name
}

/** One education form that a bulk-attach skipped because it was already attached. */
export interface SkippedForm {
  readonly educationForm: string
  readonly educationFormName: string
}

/** Result of a bulk attach — the rows created (one per new form) and the forms skipped as duplicates. */
export interface SpecialityAttachmentBulkResult {
  readonly created: SpecialityAttachmentRow[]
  readonly skipped: SkippedForm[]
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

type Wrapped<T> = { success: boolean; data: T }

const BASE_URL = '/api/v1/web/registry/speciality-attachments'

export const specialityAttachmentsApi = {
  list: async (
    params: SpecialityAttachmentsParams = {},
    signal?: AbortSignal,
  ): Promise<PageResponse<SpecialityAttachmentRow>> => {
    const response = await apiClient.get<Wrapped<PageResponse<SpecialityAttachmentRow>>>(BASE_URL, {
      params,
      signal,
    })
    return response.data.data
  },

  getById: async (id: string, signal?: AbortSignal): Promise<SpecialityAttachmentRow> => {
    const response = await apiClient.get<Wrapped<SpecialityAttachmentRow>>(`${BASE_URL}/${id}`, {
      signal,
    })
    return response.data.data
  },

  /** Filter-dropdown options — only the OTMs / education types / forms present in attachments. */
  filterOptions: async (signal?: AbortSignal): Promise<SpecialityAttachmentFilterOptions> => {
    const response = await apiClient.get<Wrapped<SpecialityAttachmentFilterOptions>>(
      `${BASE_URL}/filter-options`,
      { signal },
    )
    return response.data.data
  },

  /** ALL education forms from the h_education_form classifier (attach/edit picker — not hard-coded). */
  educationForms: async (signal?: AbortSignal): Promise<ClassifierOption[]> => {
    const response = await apiClient.get<Wrapped<ClassifierOption[]>>(
      `${BASE_URL}/education-forms`,
      { signal },
    )
    return response.data.data
  },

  /** ALL education types from the h_education_type classifier (attach picker — not hard-coded). */
  educationTypes: async (signal?: AbortSignal): Promise<ClassifierOption[]> => {
    const response = await apiClient.get<Wrapped<ClassifierOption[]>>(
      `${BASE_URL}/education-types`,
      { signal },
    )
    return response.data.data
  },

  /**
   * Streams the current-filter (or whole) result set as an .xlsx blob (server-side, no cap).
   * Pass no filters to export everything in scope. Generated in-memory — nothing is persisted.
   */
  exportXlsx: async (
    params: Omit<SpecialityAttachmentsParams, 'page' | 'size' | 'sort'> = {},
  ): Promise<Blob> => {
    const response = await apiClient.get(`${BASE_URL}/export`, {
      params,
      responseType: 'blob',
    })
    return response.data as Blob
  },

  /** Attach a speciality to a university (create). Status defaults to ACTIVE when omitted. */
  create: async (payload: {
    universityCode: string
    specialityId: string
    educationForm: string
    eduYear?: number
    status?: string
  }): Promise<SpecialityAttachmentRow> => {
    const response = await apiClient.post<Wrapped<SpecialityAttachmentRow>>(BASE_URL, payload)
    return response.data.data
  },

  /**
   * Attach one speciality to one university across SEVERAL education forms at once. One row is
   * created per form; forms already attached (same speciality + year) come back under `skipped`.
   */
  createBulk: async (payload: {
    universityCode: string
    specialityId: string
    educationForms: string[]
    eduYear?: number
    status?: string
  }): Promise<SpecialityAttachmentBulkResult> => {
    const response = await apiClient.post<Wrapped<SpecialityAttachmentBulkResult>>(
      `${BASE_URL}/bulk`,
      payload,
    )
    return response.data.data
  },

  /** Edit an existing attachment — speciality/form/year/status. University + education type are fixed. */
  update: async (
    id: string,
    payload: {
      specialityId: string
      educationForm: string
      eduYear: number
      status: string
    },
  ): Promise<SpecialityAttachmentRow> => {
    const response = await apiClient.put<Wrapped<SpecialityAttachmentRow>>(
      `${BASE_URL}/${id}`,
      payload,
    )
    return response.data.data
  },

  /** Detach a speciality from a university (soft delete). */
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/${id}`)
  },
}
