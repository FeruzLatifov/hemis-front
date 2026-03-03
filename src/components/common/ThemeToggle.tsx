import { Sun, Moon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/hooks/useTheme'

export default function ThemeToggle() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="header-btn flex h-9 w-9 items-center justify-center rounded-lg border md:h-10 md:w-10"
      title={isDark ? t('Light') : t('Dark')}
      aria-label={t('Toggle theme')}
    >
      {isDark ? (
        <Sun className="text-color-secondary h-4 w-4 md:h-5 md:w-5" />
      ) : (
        <Moon className="text-color-secondary h-4 w-4 md:h-5 md:w-5" />
      )}
    </button>
  )
}
