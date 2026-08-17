import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  specialityAttachmentsApi,
  type SpecialityAttachmentsParams,
} from '@/api/specialityAttachments.api'
import { queryKeys } from '@/lib/queryKeys'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { extractApiErrorMessage } from '@/utils/error.util'

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

/** Attach a speciality to a university. Invalidates the list + filter options on success. */
export function useCreateSpecialityAttachment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      universityCode: string
      specialityId: string
      educationForm: string
      eduYear?: number
      status?: string
    }) => specialityAttachmentsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.specialityAttachments.all })
      toast.success(i18n.t('Successfully created'))
    },
    onError: (error) => toast.error(extractApiErrorMessage(error)),
  })
}

/** Edit an attachment (speciality/form/year/status). Invalidates the list + filter options on success. */
export function useUpdateSpecialityAttachment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: { specialityId: string; educationForm: string; eduYear: number; status: string }
    }) => specialityAttachmentsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.specialityAttachments.all })
      toast.success(i18n.t('Successfully updated'))
    },
    onError: (error) => toast.error(extractApiErrorMessage(error)),
  })
}

/** Detach a speciality from a university (soft delete). */
export function useDeleteSpecialityAttachment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => specialityAttachmentsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.specialityAttachments.all })
      toast.success(i18n.t('Successfully deleted'))
    },
    onError: (error) => toast.error(extractApiErrorMessage(error)),
  })
}
