import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { outboxApi } from '@/api/outbox.api'
import { queryKeys } from '@/lib/queryKeys'
import { toast } from 'sonner'
import i18n from '@/i18n/config'
import { extractApiErrorMessage } from '@/utils/error.util'
import type { OutboxListParams } from '@/types/outbox.types'

const STATS_REFETCH_INTERVAL_MS = 10_000

export function useOutboxList(params: OutboxListParams = {}) {
  return useQuery({
    queryKey: queryKeys.outbox.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => outboxApi.list(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useOutboxStats() {
  return useQuery({
    queryKey: queryKeys.outbox.stats,
    queryFn: ({ signal }) => outboxApi.stats(signal),
    refetchInterval: STATS_REFETCH_INTERVAL_MS,
  })
}

export function useOutboxEvent(id: string) {
  return useQuery({
    queryKey: queryKeys.outbox.byId(id),
    queryFn: ({ signal }) => outboxApi.getById(id, signal),
    enabled: !!id,
  })
}

export function useOutboxRetry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => outboxApi.retry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.outbox.all })
      toast.success(i18n.t('Outbox event re-queued for publish'))
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error, i18n.t('Failed to retry outbox event')))
    },
  })
}

export function useOutboxDiscard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => outboxApi.discard(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.outbox.all })
      toast.success(i18n.t('Outbox event discarded'))
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error, i18n.t('Failed to discard outbox event')))
    },
  })
}
