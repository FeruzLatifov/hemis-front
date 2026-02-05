import { renderHook } from '@testing-library/react'
import { useTheme } from '@/hooks/useTheme'

describe('useTheme', () => {
  it('throws an error when not wrapped in ThemeProvider', () => {
    // Suppress the React error boundary console output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(() => useTheme())).toThrow(
      'useTheme must be used within a ThemeProvider',
    )

    consoleSpy.mockRestore()
  })

  it('error message is descriptive about requiring ThemeProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    let thrownError: Error | undefined
    try {
      renderHook(() => useTheme())
    } catch (error) {
      thrownError = error as Error
    }

    expect(thrownError).toBeDefined()
    expect(thrownError!.message).toBe('useTheme must be used within a ThemeProvider')

    consoleSpy.mockRestore()
  })
})
