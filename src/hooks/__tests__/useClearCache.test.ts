import { renderHook, act } from '@testing-library/react'
import { useClearCache } from '../useClearCache'
import apiClient from '@/api/client'
import { toast } from 'sonner'

// Mock dependencies
vi.mock('@/api/client', () => ({
  default: {
    post: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'uz' },
  }),
}))

describe('useClearCache', () => {
  const reloadMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    // Stub window.location with a mock that has reload
    vi.stubGlobal('location', {
      ...window.location,
      reload: reloadMock,
      href: window.location.href,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('returns isClearingCache as false initially', () => {
    const { result } = renderHook(() => useClearCache())
    expect(result.current.isClearingCache).toBe(false)
  })

  it('shows success toast and reloads on successful cache clear', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { success: true } })

    const { result } = renderHook(() => useClearCache())

    await act(async () => {
      await result.current.clearCache()
    })

    expect(toast.success).toHaveBeenCalledWith(
      'Cache cleared',
      expect.objectContaining({ duration: 2000 }),
    )

    // Advance timer to trigger reload
    act(() => {
      vi.advanceTimersByTime(1500)
    })

    expect(reloadMock).toHaveBeenCalled()
  })

  it('shows error toast when response success is false with message', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { success: false, message: 'Permission denied' },
    })

    const { result } = renderHook(() => useClearCache())

    await act(async () => {
      await result.current.clearCache()
    })

    expect(toast.error).toHaveBeenCalledWith('Permission denied')
  })

  it('shows fallback error toast when response success is false without message', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { success: false },
    })

    const { result } = renderHook(() => useClearCache())

    await act(async () => {
      await result.current.clearCache()
    })

    expect(toast.error).toHaveBeenCalledWith('Error clearing cache')
  })

  it('shows error toast on API exception', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Network failure'))

    const { result } = renderHook(() => useClearCache())

    await act(async () => {
      await result.current.clearCache()
    })

    expect(toast.error).toHaveBeenCalled()
  })

  it('resets isClearingCache after completion', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { success: true } })

    const { result } = renderHook(() => useClearCache())

    await act(async () => {
      await result.current.clearCache()
    })

    // After clearCache resolves, isClearingCache should be false (finally block)
    expect(result.current.isClearingCache).toBe(false)
  })
})
