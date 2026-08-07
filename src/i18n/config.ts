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

// Intl chegarasi uchun YAROQLI BCP-47 teglari (Intl.NumberFormat / DateTimeFormat /
// PluralRules). Ilova ichidagi `uz`/`oz` id'lari va backend `uz-UZ`/`oz-UZ` teglari —
// barqaror identifikator, lekin O'zbek yozuvlari uchun yaroqli BCP-47 EMAS: Kirill =
// `uz-Cyrl-UZ`, Lotin = `uz-Latn-UZ`. Ko'plik (plural) va son/sana formatlash til
// jihatdan to'g'ri bo'lishi uchun shu yerda resolve qilamiz — locale id'larini
// butun ilova bo'ylab qayta nomlamasdan.
export const intlLocaleMap: Record<string, string> = {
  uz: 'uz-Latn-UZ',
  oz: 'uz-Cyrl-UZ',
  ru: 'ru-RU',
  en: 'en-US',
  'uz-UZ': 'uz-Latn-UZ',
  'oz-UZ': 'uz-Cyrl-UZ',
  'ru-RU': 'ru-RU',
  'en-US': 'en-US',
}

// Har qanday ilova locale id'ini (short yoki backend BCP-47-simon) Intl uchun yaroqli
// BCP-47 tegiga aylantiradi. Noma'lum bo'lsa → uz-Latn-UZ (default).
export const toIntlLocale = (lng: string): string =>
  intlLocaleMap[lng] ?? intlLocaleMap[bcp47ToShort[lng]] ?? 'uz-Latn-UZ'

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
  // Uzbek-first fallback: agar aktiv til (ru/oz/en) JSON'da kalit yo'q bo'lsa →
  // uz (default o'zbekcha) ko'rsatiladi; uz'da ham bo'lmasa oxirgi chora sifatida en.
  // Xom kalit (inglizcha manba matni) hech qachon default sifatida chiqmaydi.
  fallbackLng: ['uz', 'en'],
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
// Also keep the document <html lang="..."> attribute in sync so screen readers
// and browser tooling pick up the active language (WCAG 3.1.1).
i18n.on('languageChanged', (lng) => {
  const bcp47Locale = shortToBcp47[lng] || lng
  if (typeof window !== 'undefined') {
    localStorage.setItem('locale', bcp47Locale)
    document.documentElement.lang = lng
  }
})

if (typeof window !== 'undefined') {
  document.documentElement.lang = savedLocale
}

export default i18n
