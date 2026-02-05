import type { MenuItem } from '@/api/menu.api'

/**
 * Get label for menu item based on current language.
 * Supports 4 languages: uz (Latin), oz (Cyrillic), ru (Russian), en (English)
 */
export function getMenuLabel(item: MenuItem, lang: string): string {
  switch (lang) {
    case 'oz':
      return item.labelOz || item.labelUz
    case 'ru':
      return item.labelRu || item.labelUz
    case 'en':
      return item.labelEn || item.labelUz
    default:
      return item.labelUz
  }
}
