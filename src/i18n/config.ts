import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import uz from './translations/uz.json'
import ru from './translations/ru.json'
import en from './translations/en.json'
import oz from './translations/oz.json'

// BCP-47 to short code mapping
const bcp47ToShort: Record<string, string> = {
  'uz-UZ': 'uz',
  'oz-UZ': 'oz',
  'ru-RU': 'ru',
  'en-US': 'en',
}

// Short code to BCP-47 mapping (also used by useMenuInit)
export const shortToBcp47: Record<string, string> = {
  uz: 'uz-UZ',
  oz: 'oz-UZ',
  ru: 'ru-RU',
  en: 'en-US',
}

// ✅ SSR/Test-safe: Get saved locale from localStorage
const getSavedLocale = (): string => {
  if (typeof window === 'undefined') {
    return 'uz' // Default for SSR/Node
  }
  const savedLocaleRaw = localStorage.getItem('locale') || 'uz'
  return bcp47ToShort[savedLocaleRaw] || savedLocaleRaw
}

const LOCAL_TRANSLATIONS = {
  uz,
  ru,
  en,
  oz,
} as const

type SupportedLang = keyof typeof LOCAL_TRANSLATIONS

const savedLocale = getSavedLocale()

i18n.use(initReactI18next).init({
  resources: Object.entries(LOCAL_TRANSLATIONS).reduce(
    (acc, [key, value]) => {
      acc[key as SupportedLang] = { translation: value }
      return acc
    },
    {} as Record<SupportedLang, { translation: typeof uz }>,
  ),
  lng: savedLocale,
  fallbackLng: 'en',
  supportedLngs: ['uz', 'ru', 'en', 'oz'],
  keySeparator: false,
  nsSeparator: false,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
})

// Add language change listener to sync with localStorage in BCP-47 format
i18n.on('languageChanged', (lng) => {
  const bcp47Locale = shortToBcp47[lng] || lng
  // SSR-safe: Only access localStorage in browser
  if (typeof window !== 'undefined') {
    localStorage.setItem('locale', bcp47Locale)
  }
})

export default i18n
