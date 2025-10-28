/**
 * i18n Configuration
 *
 * Internationalization setup for HEMIS admin panel
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uz from './translations/uz.json';
import ru from './translations/ru.json';
import en from './translations/en.json';

// Get saved locale or default to Uzbek
const savedLocale = localStorage.getItem('locale') || 'uz';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      uz: { translation: uz },
      ru: { translation: ru },
      en: { translation: en },
    },
    lng: savedLocale,
    fallbackLng: 'uz',
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export default i18n;
