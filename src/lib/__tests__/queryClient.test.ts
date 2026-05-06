import { QueryClient } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'

describe('queryClient', () => {
  // ─── Instance check ────────────────────────────────────────────────

  describe('instance', () => {
    it('is an instance of QueryClient', () => {
      expect(queryClient).toBeInstanceOf(QueryClient)
    })

    it('is a singleton (same reference on re-import)', async () => {
      // Re-import to verify it is the same object
      const { queryClient: reimported } = await import('@/lib/queryClient')
      expect(reimported).toBe(queryClient)
    })
  })

  // ─── Default query options ─────────────────────────────────────────

  describe('default query options', () => {
    it('has staleTime set to 5 minutes', () => {
      const defaults = queryClient.getDefaultOptions()
      expect(defaults.queries?.staleTime).toBe(1000 * 60 * 5)
    })

    it('has gcTime set to 30 minutes', () => {
      const defaults = queryClient.getDefaultOptions()
      expect(defaults.queries?.gcTime).toBe(1000 * 60 * 30)
    })

    it('has retry as a function that skips 4xx errors', () => {
      const defaults = queryClient.getDefaultOptions()
      // queryClient.ts uses a function so 4xx client errors don't retry but transient
      // failures get up to 2 attempts (CLAUDE.md rule). Verify the shape + behaviour.
      expect(typeof defaults.queries?.retry).toBe('function')
      const retryFn = defaults.queries?.retry as (failureCount: number, error: unknown) => boolean
      const error4xx = { response: { status: 404 } }
      const error5xx = { response: { status: 500 } }
      expect(retryFn(0, error4xx)).toBe(false)
      expect(retryFn(0, error5xx)).toBe(true)
      expect(retryFn(2, error5xx)).toBe(false)
    })

    it('has refetchOnWindowFocus disabled', () => {
      const defaults = queryClient.getDefaultOptions()
      expect(defaults.queries?.refetchOnWindowFocus).toBe(false)
    })

    it('has refetchOnReconnect set to always', () => {
      const defaults = queryClient.getDefaultOptions()
      expect(defaults.queries?.refetchOnReconnect).toBe('always')
    })
  })

  // ─── Default mutation options ──────────────────────────────────────

  describe('default mutation options', () => {
    it('has retry set to 0 for mutations', () => {
      const defaults = queryClient.getDefaultOptions()
      expect(defaults.mutations?.retry).toBe(0)
    })
  })

  // ─── Functional verification ───────────────────────────────────────

  describe('functionality', () => {
    it('can set and get query data', () => {
      queryClient.setQueryData(['test-key'], { foo: 'bar' })
      const data = queryClient.getQueryData(['test-key'])
      expect(data).toEqual({ foo: 'bar' })

      // Clean up
      queryClient.removeQueries({ queryKey: ['test-key'] })
    })

    it('can invalidate queries without errors', () => {
      expect(() => {
        queryClient.invalidateQueries({ queryKey: ['non-existent'] })
      }).not.toThrow()
    })

    it('can clear the query cache', () => {
      queryClient.setQueryData(['clear-test'], 'data')
      queryClient.clear()

      const data = queryClient.getQueryData(['clear-test'])
      expect(data).toBeUndefined()
    })
  })
})
