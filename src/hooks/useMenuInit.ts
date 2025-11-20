/**
 * useMenuInit Hook
 *
 * Initializes menu data from backend on app startup
 * Handles loading, error states, cache staleness, and language changes
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMenuStore } from '../stores/menuStore';
import { useAuthStore } from '../stores/authStore';

// BCP-47 mapping for menu API
const shortToBcp47: Record<string, string> = {
  'uz': 'uz-UZ',
  'oz': 'oz-UZ',
  'ru': 'ru-RU',
  'en': 'en-US'
};

export const useMenuInit = () => {
  const { i18n } = useTranslation();
  const { fetchMenu, isLoading, error, menuItems, clearMenu } = useMenuStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    // Clear menu when user logs out
    if (!isAuthenticated) {
      console.log('User logged out, clearing menu cache');
      clearMenu();
      return;
    }

    // ALWAYS fetch menu on new session/login
    // This ensures fresh data after login
    console.log('🔄 Fetching fresh menu from backend on login...');
    const currentLang = i18n.language || 'uz';
    const bcp47Locale = shortToBcp47[currentLang] || 'uz-UZ';
    fetchMenu(bcp47Locale);

    // Note: i18n.language NOT in deps - languageChanged listener handles lang switches
  }, [isAuthenticated, fetchMenu, clearMenu, i18n]);

  // Listen for language changes and refetch menu in background
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const handleLanguageChange = (lng: string) => {
      console.log(`🌐 Language changed to ${lng}, refetching menu in background...`);
      const bcp47Locale = shortToBcp47[lng] || 'uz-UZ';

      // Fetch menu silently in background (no loading UI)
      fetchMenu(bcp47Locale);
    };

    // Subscribe to i18n language change events
    i18n.on('languageChanged', handleLanguageChange);

    // Cleanup listener on unmount
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [isAuthenticated, fetchMenu, i18n]);

  return {
    isLoading,
    error,
    hasMenu: menuItems.length > 0,
  };
};
