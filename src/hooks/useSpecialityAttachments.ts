import { useQuery, keepPreviousData } from '@tanstack/react-query'
import {
  specialityAttachmentsApi,
  type SpecialityAttachmentsParams,
} from '@/api/specialityAttachments.api'
import { queryKeys } from '@/lib/queryKeys'

/**
 * Paginated list of modern speciality→OTM attachments (h_speciality_attachment).
 * Review-only — no create/update/delete hooks (this card is read-only).
 */
export function useSpecialityAttachments(
  params: SpecialityAttachmentsParams = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.specialityAttachments.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => specialityAttachmentsApi.list(params, signal),
    placeholderData: keepPreviousData,
    ...(options?.enabled !== undefined && { enabled: options.enabled }),
  })
}

/**
 * Filter-dropdown options for the attachments page — only the OTMs / education types / forms
 * that actually occur in the (scope-filtered) attachment data, so a dropdown never offers a
 * choice that returns zero rows. Cached generously (changes only when attachments change).
 */
export function useSpecialityAttachmentFilterOptions() {
  return useQuery({
    queryKey: queryKeys.specialityAttachments.filterOptions,
    queryFn: ({ signal }) => specialityAttachmentsApi.filterOptions(signal),
    staleTime: 5 * 60 * 1000,
  })
}
