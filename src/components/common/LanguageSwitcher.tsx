/**
 * Language Switcher Component
 *
 * Professional 4-language switcher for HEMIS
 * uz-UZ (O'zbek lotin), oz-UZ (Ўзбек кирилл), ru-RU (Русский), en-US (English)
 */

import { useState, useRef, useEffect } from 'react'
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
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get current language
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

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

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode)
    setIsOpen(false)

    // No full reload; Sidebar labels update reactively via i18n
    // If needed, backend-driven menu can be refetched silently
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Language Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg border transition-colors"
        style={{
          backgroundColor: '#FFFFFF',
          borderColor: '#E5E7EB'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#2F80ED'
          e.currentTarget.style.backgroundColor = '#F5F6FA'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#E5E7EB'
          e.currentTarget.style.backgroundColor = '#FFFFFF'
        }}
        title={currentLanguage.nativeName}
      >
        <Languages className="h-4 w-4 md:h-5 md:w-5" style={{ color: '#6B7280' }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-56 rounded-lg border overflow-hidden"
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: '#E5E7EB',
            boxShadow: '0 4px 6px rgba(15, 23, 42, 0.1)',
            zIndex: 50
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-2 border-b"
            style={{
              backgroundColor: '#F5F6FA',
              borderColor: '#E5E7EB'
            }}
          >
            <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>
              Select Language / Tilni tanlang
            </p>
          </div>

          {/* Language Options */}
          <div className="py-1">
            {languages.map((language) => {
              const isActive = language.code === i18n.language

              return (
                <button
                  key={language.code}
                  type="button"
                  onClick={() => handleLanguageChange(language.code)}
                  className="flex w-full items-center justify-between px-4 py-3 transition-colors"
                  style={{
                    backgroundColor: isActive ? '#EFF6FF' : 'transparent',
                    color: isActive ? '#2F80ED' : '#1E2124'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#F5F6FA'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{language.flag}</span>
                    <div className="text-left">
                      <p className="text-sm font-medium">{language.nativeName}</p>
                      <p className="text-xs" style={{ color: '#6B7280' }}>
                        {language.name}
                      </p>
                    </div>
                  </div>

                  {isActive && (
                    <Check className="h-4 w-4" style={{ color: '#2F80ED' }} />
                  )}
                </button>
              )
            })}
          </div>

          {/* Footer Info */}
          <div
            className="px-4 py-2 border-t"
            style={{
              backgroundColor: '#F5F6FA',
              borderColor: '#E5E7EB'
            }}
          >
            <p className="text-xs" style={{ color: '#6B7280' }}>
              Current: <span className="font-medium" style={{ color: '#1E2124' }}>{currentLanguage.nativeName}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
