import { useEffect, useState, type ReactNode } from 'react'
import { ThemeProviderContext, type Theme, type ThemeProviderState } from '@/hooks/useTheme'

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'ui-theme',
}: ThemeProviderProps) {
  const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') {
      return defaultTheme
    }
    const stored = localStorage.getItem(storageKey)
    // Migrate legacy 'system' value to 'light'
    if (stored === 'system') return 'light'
    return (stored as Theme) || defaultTheme
  }

  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [theme])

  const value: ThemeProviderState = {
    theme,
    setTheme: (theme: Theme) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, theme)
      }
      setThemeState(theme)
    },
  }

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>
}
