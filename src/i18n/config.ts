import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import axios from 'axios';
import { getTranslationsByLanguage } from '../api/translation.api';
// Local fallback resources (used if backend is unavailable)
import uz from './translations/uz.json';
import ru from './translations/ru.json';
import en from './translations/en.json';
import oz from './translations/oz.json';

// BCP-47 to short code mapping
const bcp47ToShort: Record<string, string> = {
  'uz-UZ': 'uz',
  'oz-UZ': 'oz',
  'ru-RU': 'ru',
  'en-US': 'en'
};

// Short code to BCP-47 mapping
const shortToBcp47: Record<string, string> = {
  'uz': 'uz-UZ',
  'oz': 'oz-UZ',
  'ru': 'ru-RU',
  'en': 'en-US'
};

// ✅ SSR/Test-safe: Get saved locale from localStorage
const getSavedLocale = (): string => {
  if (typeof window === 'undefined') {
    return 'uz'; // Default for SSR/Node
  }
  const savedLocaleRaw = localStorage.getItem('locale') || 'uz';
  return bcp47ToShort[savedLocaleRaw] || savedLocaleRaw;
};

const LOCAL_TRANSLATIONS = {
  uz,
  ru,
  en,
  oz,
} as const;

type SupportedLang = keyof typeof LOCAL_TRANSLATIONS;

const savedLocale = getSavedLocale();

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    // Local resources as fallback (works offline / when backend down)
    resources: Object.entries(LOCAL_TRANSLATIONS).reduce((acc, [key, value]) => {
      acc[key as SupportedLang] = { translation: value };
      return acc;
    }, {} as Record<SupportedLang, { translation: typeof uz }>),
    lng: savedLocale,
    fallbackLng: 'en',
    supportedLngs: ['uz', 'ru', 'en', 'oz'],
    keySeparator: false,
    nsSeparator: false,

    // Backend configuration
    backend: {
      // Custom loader using our API client
      loadPath: '{{lng}}',
      parse: (data: string) => JSON.parse(data),

      // Custom request function
      request: async (_options: unknown, url: string, _payload: unknown, callback: (error: Error | null, response: { status: number; data: string | null }) => void) => {
        const lang = (url as SupportedLang) || 'uz';
        const fallbackTranslation = LOCAL_TRANSLATIONS[lang] ?? LOCAL_TRANSLATIONS.uz;

        const serveFallback = (_reason: string, _error?: unknown) => {
          callback(null, {
            status: 200,
            data: JSON.stringify(fallbackTranslation),
          });
        };

        if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
          serveFallback('Browser offline detected');
          return;
        }

        try {
          const translations = await getTranslationsByLanguage(lang);
          callback(null, {
            status: 200,
            data: JSON.stringify(translations),
          });
        } catch (error: unknown) {
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            // During login we might not have auth headers yet; fallback immediately
            serveFallback('Unauthorized while fetching translations', error);
            return;
          }

          serveFallback('Backend translations unavailable', error);
        }
      },
    },

    interpolation: {
      escapeValue: false, // React already escapes
    },

    // Note: No i18next cache plugin registered (e.g., i18next-localstorage-backend)
    // Translations are fetched fresh on reload but fallback to bundled JSON immediately
    // Backend caching (Redis + Caffeine) handles server-side performance

    // React specific
    react: {
      useSuspense: false,
    },
  });

// Add language change listener to sync with localStorage in BCP-47 format
i18n.on('languageChanged', (lng) => {
  const bcp47Locale = shortToBcp47[lng] || lng;
  // SSR-safe: Only access localStorage in browser
  if (typeof window !== 'undefined') {
    localStorage.setItem('locale', bcp47Locale);
  }
});

export default i18n;
