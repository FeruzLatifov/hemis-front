/**
 * TanStack Query Configuration Utilities
 *
 * Reusable query and mutation configurations with:
 * - Optimistic updates
 * - Error handling
 * - Request cancellation
 * - Retry logic
 */

import { QueryClient, type MutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

// ============================================================================
// Optimistic Update Helpers
// ============================================================================

/**
 * Create optimistic update mutation options
 *
 * @example
 * const mutation = useMutation({
 *   ...createOptimisticMutation({
 *     queryClient,
 *     queryKey: ['universities'],
 *     updateFn: (old, newItem) => [...old, newItem],
 *     successMessage: 'Universitet yaratildi',
 *     errorMessage: 'Universitet yaratishda xatolik',
 *   }),
 *   mutationFn: createUniversity,
 * })
 */
export interface OptimisticMutationOptions<TData, TVariables> {
  queryClient: QueryClient
  queryKey: readonly unknown[]
  updateFn: (oldData: TData | undefined, variables: TVariables) => TData
  successMessage?: string
  errorMessage?: string
}

export function createOptimisticMutation<TData, TVariables, TContext = { previousData: TData }>(
  options: OptimisticMutationOptions<TData, TVariables>,
): Pick<
  MutationOptions<TData, Error, TVariables, TContext>,
  'onMutate' | 'onError' | 'onSuccess' | 'onSettled'
> {
  const { queryClient, queryKey, updateFn, successMessage, errorMessage } = options

  return {
    onMutate: async (variables: TVariables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TData>(queryKey)

      // Optimistically update
      if (previousData !== undefined) {
        queryClient.setQueryData<TData>(queryKey, (old) => updateFn(old, variables))
      }

      return { previousData } as TContext
    },

    onError: (_error: Error, _variables: TVariables, context: TContext | undefined) => {
      // Rollback on error
      if (context && typeof context === 'object' && 'previousData' in context) {
        queryClient.setQueryData(queryKey, (context as { previousData: TData }).previousData)
      }

      if (errorMessage) {
        toast.error(errorMessage)
      }
    },

    onSuccess: () => {
      if (successMessage) {
        toast.success(successMessage)
      }
    },

    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey })
    },
  }
}

// ============================================================================
// Query Options Factories
// ============================================================================

/**
 * Standard query options with error handling
 */
export interface StandardQueryOptions {
  staleTime?: number
  gcTime?: number
  retry?: number | boolean
  refetchOnWindowFocus?: boolean
  enabled?: boolean
}

export const defaultQueryOptions: StandardQueryOptions = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 30 * 60 * 1000, // 30 minutes
  retry: 1,
  refetchOnWindowFocus: false,
}

/**
 * Create query options for list queries
 */
export function listQueryOptions(options: StandardQueryOptions = {}): StandardQueryOptions {
  return {
    ...defaultQueryOptions,
    ...options,
  }
}

/**
 * Create query options for detail queries
 */
export function detailQueryOptions(options: StandardQueryOptions = {}): StandardQueryOptions {
  return {
    ...defaultQueryOptions,
    staleTime: 2 * 60 * 1000, // 2 minutes for details
    ...options,
  }
}

/**
 * Create query options for dictionary/reference data
 */
export function dictionaryQueryOptions(options: StandardQueryOptions = {}): StandardQueryOptions {
  return {
    ...defaultQueryOptions,
    staleTime: 30 * 60 * 1000, // 30 minutes for dictionaries
    gcTime: 60 * 60 * 1000, // 1 hour
    ...options,
  }
}

// ============================================================================
// Request Cancellation
// ============================================================================

/**
 * Create an AbortController signal for request cancellation
 *
 * @example
 * const { signal, cancel } = createCancellableRequest()
 *
 * try {
 *   const data = await fetch(url, { signal })
 * } catch (e) {
 *   if (e.name === 'AbortError') {
 *     console.log('Request was cancelled')
 *   }
 * }
 *
 * // Later: cancel()
 */
export function createCancellableRequest(): {
  signal: AbortSignal
  cancel: () => void
} {
  const controller = new AbortController()

  return {
    signal: controller.signal,
    cancel: () => controller.abort(),
  }
}

/**
 * Wrap a fetch function to support cancellation via TanStack Query
 *
 * @example
 * const fetchData = withCancellation(async (params, signal) => {
 *   const response = await axios.get('/api/data', { signal })
 *   return response.data
 * })
 *
 * // In useQuery:
 * useQuery({
 *   queryKey: ['data'],
 *   queryFn: ({ signal }) => fetchData(params, signal),
 * })
 */
export function withCancellation<TParams, TResult>(
  fn: (params: TParams, signal?: AbortSignal) => Promise<TResult>,
): (params: TParams, signal?: AbortSignal) => Promise<TResult> {
  return async (params: TParams, signal?: AbortSignal) => {
    if (signal?.aborted) {
      throw new DOMException('Request cancelled', 'AbortError')
    }

    return fn(params, signal)
  }
}
