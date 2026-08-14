import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { oauthClientsApi } from '@/api/oauthClients.api'
import { queryKeys } from '@/lib/queryKeys'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { extractApiErrorMessage } from '@/utils/error.util'
import type { OAuthClientsParams, OAuthClientCreateRequest } from '@/types/oauthClient.types'

/** Paginated OTM API-client list. */
export function useOAuthClients(params: OAuthClientsParams = {}) {
  return useQuery({
    queryKey: queryKeys.oauthClients.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => oauthClientsApi.getClients(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useCreateOAuthClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: OAuthClientCreateRequest) => oauthClientsApi.createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.oauthClients.all })
      toast.success(i18n.t('Successfully created'))
    },
    onError: (error) => toast.error(extractApiErrorMessage(error)),
  })
}

export function useToggleOAuthClientStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => oauthClientsApi.toggleStatus(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.oauthClients.all }),
    onError: (error) => toast.error(extractApiErrorMessage(error)),
  })
}

export function useDeleteOAuthClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => oauthClientsApi.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.oauthClients.all })
      toast.success(i18n.t('Successfully deleted'))
    },
    onError: (error) => toast.error(extractApiErrorMessage(error)),
  })
}
