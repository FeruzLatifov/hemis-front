/**
 * Language Switcher Component
 *
 * Professional 4-language switcher for HEMIS
 * uz-UZ (O'zbek lotin), oz-UZ (Ўзбек кирилл), ru-RU (Русский), en-US (English)
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Languages, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
}

const languages: Language[] = [
  { code: 'uz', name: 'Uzbek Latin', nativeName: "O'zbek", flag: '🇺🇿' },
  { code: 'oz', name: 'Uzbek Cyrillic', nativeName: 'Ўзбек', flag: '🇺🇿' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
]

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get current language
  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const [focusedIndex, setFocusedIndex] = useState(-1)

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode)
    setIsOpen(false)
    setFocusedIndex(-1)
  }

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setIsOpen(true)
          setFocusedIndex(0)
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setFocusedIndex((prev) => (prev + 1) % languages.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setFocusedIndex((prev) => (prev - 1 + languages.length) % languages.length)
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          if (focusedIndex >= 0) {
            i18n.changeLanguage(languages[focusedIndex].code)
            setIsOpen(false)
            setFocusedIndex(-1)
          }
          break
        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          setFocusedIndex(-1)
          break
      }
    },
    [isOpen, focusedIndex, i18n],
  )

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Language Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="header-btn flex h-9 w-9 items-center justify-center rounded-lg border md:h-10 md:w-10"
        title={currentLanguage.nativeName}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Languages className="text-color-secondary h-4 w-4 md:h-5 md:w-5" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="card-white absolute top-full right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border"
          style={{ boxShadow: '0 4px 6px rgba(15, 23, 42, 0.1)' }}
        >
          {/* Header */}
          <div className="layout-bg border-color-light border-b px-4 py-2">
            <p className="text-color-secondary text-xs font-semibold">{t('Select language')}</p>
          </div>

          {/* Language Options */}
          <div
            className="py-1"
            role="listbox"
            tabIndex={0}
            aria-label={t('Select language')}
            onKeyDown={handleKeyDown}
          >
            {languages.map((language, idx) => {
              const isActive = language.code === i18n.language
              const isFocused = focusedIndex === idx

              return (
                <button
                  key={language.code}
                  type="button"
                  onClick={() => handleLanguageChange(language.code)}
                  className={`flex w-full items-center justify-between px-4 py-3 ${
                    isActive ? 'lang-item--active' : isFocused ? 'lang-item layout-bg' : 'lang-item'
                  }`}
                  role="option"
                  aria-selected={isActive}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{language.flag}</span>
                    <div className="text-left">
                      <p className="text-sm font-medium">{language.nativeName}</p>
                      <p className="text-color-secondary text-xs">{language.name}</p>
                    </div>
                  </div>

                  {isActive && <Check className="h-4 w-4 text-[var(--primary)]" />}
                </button>
              )
            })}
          </div>

          {/* Footer Info */}
          <div className="layout-bg border-color-light border-t px-4 py-2">
            <p className="text-color-secondary text-xs">
              {t('Current')}:{' '}
              <span className="text-color-primary font-medium">{currentLanguage.nativeName}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
