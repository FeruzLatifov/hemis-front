import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createOptimisticMutation,
  defaultQueryOptions,
  listQueryOptions,
  detailQueryOptions,
  dictionaryQueryOptions,
  createCancellableRequest,
  withCancellation,
} from '../queryConfig'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockedToast = vi.mocked(toast)

type MutationHandler = (...args: unknown[]) => unknown

describe('createOptimisticMutation', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    vi.clearAllMocks()
  })

  it('returns onMutate, onError, onSuccess, onSettled handlers', () => {
    const result = createOptimisticMutation<string[], string>({
      queryClient,
      queryKey: ['test'],
      updateFn: (old, item) => [...(old || []), item],
    })

    expect(result.onMutate).toBeDefined()
    expect(result.onError).toBeDefined()
    expect(result.onSuccess).toBeDefined()
    expect(result.onSettled).toBeDefined()
  })

  it('onMutate cancels queries and updates cache optimistically', async () => {
    queryClient.setQueryData(['items'], ['a', 'b'])
    const cancelSpy = vi.spyOn(queryClient, 'cancelQueries').mockResolvedValue()

    const mutation = createOptimisticMutation<string[], string>({
      queryClient,
      queryKey: ['items'],
      updateFn: (old, item) => [...(old || []), item],
    })

    const onMutate = mutation.onMutate as MutationHandler
    const context = await onMutate('c')
    expect(cancelSpy).toHaveBeenCalledWith({ queryKey: ['items'] })
    expect(queryClient.getQueryData(['items'])).toEqual(['a', 'b', 'c'])
    expect(context).toEqual({ previousData: ['a', 'b'] })
  })

  it('onError rolls back to previous data and shows error toast', () => {
    queryClient.setQueryData(['items'], ['a', 'b', 'c'])

    const mutation = createOptimisticMutation<string[], string>({
      queryClient,
      queryKey: ['items'],
      updateFn: (old, item) => [...(old || []), item],
      errorMessage: 'Failed!',
    })

    const onError = mutation.onError as MutationHandler
    onError(new Error('test'), 'c', { previousData: ['a', 'b'] })
    expect(queryClient.getQueryData(['items'])).toEqual(['a', 'b'])
    expect(mockedToast.error).toHaveBeenCalledWith('Failed!')
  })

  it('onSuccess shows success toast', () => {
    const mutation = createOptimisticMutation<string[], string>({
      queryClient,
      queryKey: ['items'],
      updateFn: (old) => old || [],
      successMessage: 'Done!',
    })

    const onSuccess = mutation.onSuccess as MutationHandler
    onSuccess([], 'x', { previousData: [] })
    expect(mockedToast.success).toHaveBeenCalledWith('Done!')
  })

  it('onSettled invalidates queries', () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue()

    const mutation = createOptimisticMutation<string[], string>({
      queryClient,
      queryKey: ['items'],
      updateFn: (old) => old || [],
    })

    const onSettled = mutation.onSettled as MutationHandler
    onSettled([], null, 'x', { previousData: [] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['items'] })
  })
})

describe('defaultQueryOptions', () => {
  it('has 5 minute stale time', () => {
    expect(defaultQueryOptions.staleTime).toBe(5 * 60 * 1000)
  })

  it('has 30 minute gc time', () => {
    expect(defaultQueryOptions.gcTime).toBe(30 * 60 * 1000)
  })
})

describe('listQueryOptions', () => {
  it('returns merged options with defaults', () => {
    const result = listQueryOptions({ enabled: false })
    expect(result.enabled).toBe(false)
    expect(result.staleTime).toBe(defaultQueryOptions.staleTime)
  })

  it('returns defaults when no options provided', () => {
    const result = listQueryOptions()
    expect(result.staleTime).toBe(defaultQueryOptions.staleTime)
  })
})

describe('detailQueryOptions', () => {
  it('uses 2 minute stale time by default', () => {
    const result = detailQueryOptions()
    expect(result.staleTime).toBe(2 * 60 * 1000)
  })

  it('allows override', () => {
    const result = detailQueryOptions({ staleTime: 1000 })
    expect(result.staleTime).toBe(1000)
  })
})

describe('dictionaryQueryOptions', () => {
  it('uses 30 minute stale time', () => {
    const result = dictionaryQueryOptions()
    expect(result.staleTime).toBe(30 * 60 * 1000)
  })

  it('uses 1 hour gc time', () => {
    const result = dictionaryQueryOptions()
    expect(result.gcTime).toBe(60 * 60 * 1000)
  })
})

describe('createCancellableRequest', () => {
  it('returns signal and cancel function', () => {
    const { signal, cancel } = createCancellableRequest()
    expect(signal).toBeInstanceOf(AbortSignal)
    expect(typeof cancel).toBe('function')
    expect(signal.aborted).toBe(false)
  })

  it('aborts signal when cancel is called', () => {
    const { signal, cancel } = createCancellableRequest()
    cancel()
    expect(signal.aborted).toBe(true)
  })
})

describe('withCancellation', () => {
  it('wraps function and passes signal through', async () => {
    const fn = vi.fn().mockResolvedValue('result')
    const wrapped = withCancellation(fn)

    const result = await wrapped('params')
    expect(result).toBe('result')
    expect(fn).toHaveBeenCalledWith('params', undefined)
  })

  it('throws if signal is already aborted', async () => {
    const fn = vi.fn().mockResolvedValue('result')
    const wrapped = withCancellation(fn)

    const controller = new AbortController()
    controller.abort()

    await expect(wrapped('params', controller.signal)).rejects.toThrow('Request cancelled')
    expect(fn).not.toHaveBeenCalled()
  })
})
