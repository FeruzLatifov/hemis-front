import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { webhooksApi } from '@/api/webhooks.api'
import { queryKeys } from '@/lib/queryKeys'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { extractApiErrorMessage } from '@/utils/error.util'
import type {
  WebhookTargetCreateRequest,
  WebhookTargetUpdateRequest,
  WebhookDeliveriesParams,
} from '@/types/webhook.types'

export function useWebhooksList() {
  return useQuery({
    queryKey: queryKeys.webhooks.list,
    queryFn: ({ signal }) => webhooksApi.listAll(signal),
    placeholderData: keepPreviousData,
  })
}

export function useWebhookById(id: string) {
  return useQuery({
    queryKey: queryKeys.webhooks.byId(id),
    queryFn: ({ signal }) => webhooksApi.getById(id, signal),
    enabled: !!id,
  })
}

export function useWebhookDeliveries(id: string, params: WebhookDeliveriesParams = {}) {
  return useQuery({
    queryKey: queryKeys.webhooks.deliveries(id, params as Record<string, unknown>),
    queryFn: ({ signal }) => webhooksApi.listDeliveries(id, params, signal),
    enabled: !!id,
    placeholderData: keepPreviousData,
  })
}

export function useWebhookDlq(params: WebhookDeliveriesParams = {}) {
  return useQuery({
    queryKey: queryKeys.webhooks.dlq(params as Record<string, unknown>),
    queryFn: ({ signal }) => webhooksApi.listDlq(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useCreateWebhook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: WebhookTargetCreateRequest) => webhooksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.all })
      toast.success(i18n.t('Webhook target created — save the plain secret!'))
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error, i18n.t('Failed to create webhook target')))
    },
  })
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: WebhookTargetUpdateRequest }) =>
      webhooksApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.byId(variables.id) })
      toast.success(i18n.t('Webhook target updated'))
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error, i18n.t('Failed to update webhook target')))
    },
  })
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => webhooksApi.deleteTarget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.all })
      toast.success(i18n.t('Webhook target deleted'))
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error, i18n.t('Failed to delete webhook target')))
    },
  })
}

export function useRegenerateWebhookSecret() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => webhooksApi.regenerateSecret(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.all })
      toast.success(i18n.t('Secret regenerated — update Univer .env immediately'))
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error, i18n.t('Failed to regenerate secret')))
    },
  })
}

export function useSendWebhookTest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => webhooksApi.sendTestEvent(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.deliveries(id) })
      toast.success(i18n.t('Test event dispatched'))
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error, i18n.t('Failed to dispatch test event')))
    },
  })
}
