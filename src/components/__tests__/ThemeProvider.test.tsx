import { render, screen, act } from '@testing-library/react'
import { ThemeProvider } from '@/components/ThemeProvider'
import { useTheme } from '@/hooks/useTheme'

// Helper component that displays and controls the theme
function ThemeConsumer() {
  const { theme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button data-testid="set-dark" onClick={() => setTheme('dark')}>
        Dark
      </button>
      <button data-testid="set-light" onClick={() => setTheme('light')}>
        Light
      </button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('light', 'dark')
  })

  it('renders children correctly', () => {
    render(
      <ThemeProvider>
        <span data-testid="child">Hello</span>
      </ThemeProvider>,
    )
    expect(screen.getByTestId('child')).toHaveTextContent('Hello')
  })

  it('applies the default theme (light) and adds class to documentElement', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('theme-value')).toHaveTextContent('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('applies a specified defaultTheme of "dark" to documentElement', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeConsumer />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('light')).toBe(false)
  })

  it('applies a specified defaultTheme of "light" to documentElement', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeConsumer />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('theme-value')).toHaveTextContent('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('reads saved theme from localStorage on mount', () => {
    localStorage.setItem('ui-theme', 'dark')

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('reads saved theme from localStorage using a custom storageKey', () => {
    localStorage.setItem('my-custom-key', 'light')

    render(
      <ThemeProvider storageKey="my-custom-key">
        <ThemeConsumer />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('theme-value')).toHaveTextContent('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
  })

  it('setTheme updates the theme, applies class to documentElement, and saves to localStorage', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )

    // Initially light
    expect(screen.getByTestId('theme-value')).toHaveTextContent('light')

    // Switch to dark
    act(() => {
      screen.getByTestId('set-dark').click()
    })

    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('light')).toBe(false)
    expect(localStorage.getItem('ui-theme')).toBe('dark')

    // Switch to light
    act(() => {
      screen.getByTestId('set-light').click()
    })

    expect(screen.getByTestId('theme-value')).toHaveTextContent('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('ui-theme')).toBe('light')
  })

  it('migrates legacy "system" value from localStorage to "light"', () => {
    localStorage.setItem('ui-theme', 'system')

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('theme-value')).toHaveTextContent('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
  })

  it('useTheme throws an error when used outside of ThemeProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    function BadConsumer() {
      useTheme()
      return <div />
    }

    expect(() => render(<BadConsumer />)).toThrow('useTheme must be used within a ThemeProvider')

    consoleSpy.mockRestore()
  })
})
