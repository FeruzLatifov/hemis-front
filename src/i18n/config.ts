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

// Get saved locale from localStorage (may be in BCP-47 or short format)
const savedLocaleRaw = localStorage.getItem('locale') || 'uz';
const savedLocale = bcp47ToShort[savedLocaleRaw] || savedLocaleRaw;

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    // Local resources as fallback (works offline / when backend down)
    resources: {
      uz: { translation: uz },
      ru: { translation: ru },
      en: { translation: en },
      oz: { translation: oz },
    },
    lng: savedLocale,
    fallbackLng: 'uz',
    supportedLngs: ['uz', 'ru', 'en', 'oz'],

    // Backend configuration
    backend: {
      // Custom loader using our API client
      loadPath: '{{lng}}',
      parse: (data: string) => JSON.parse(data),

      // Custom request function
      request: async (_options: unknown, url: string, _payload: unknown, callback: (error: Error | null, response: { status: number; data: string | null }) => void) => {
        try {
          const lang = url as 'uz' | 'oz' | 'ru' | 'en';
          const translations = await getTranslationsByLanguage(lang);
          callback(null, {
            status: 200,
            data: JSON.stringify(translations),
          });
        } catch (error: unknown) {
          console.error('Failed to load translations:', error);
          const normalizedError = error instanceof Error ? error : new Error('Failed to load translations');
          const status = axios.isAxiosError(error)
            ? error.response?.status ?? 500
            : 500;
          callback(normalizedError, {
            status,
            data: null,
          });
        }
      },
    },

    interpolation: {
      escapeValue: false, // React already escapes
    },

    // Cache translations
    cache: {
      enabled: true,
      expirationTime: 60 * 60 * 1000, // 1 hour
    },

    // React specific
    react: {
      useSuspense: true,
    },
  });

// Add language change listener to sync with localStorage in BCP-47 format
i18n.on('languageChanged', (lng) => {
  const bcp47Locale = shortToBcp47[lng] || lng;
  localStorage.setItem('locale', bcp47Locale);
  console.log(`Language changed to ${lng}, saved as ${bcp47Locale} in localStorage`);
});

export default i18n;
