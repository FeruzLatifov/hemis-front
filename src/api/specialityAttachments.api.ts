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

  /** Attach a speciality to a university (create). */
  create: async (payload: {
    universityCode: string
    specialityId: string
    educationForm: string
    eduYear?: number
  }): Promise<SpecialityAttachmentRow> => {
    const response = await apiClient.post<Wrapped<SpecialityAttachmentRow>>(BASE_URL, payload)
    return response.data.data
  },

  /** Detach a speciality from a university (soft delete). */
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/${id}`)
  },
}
