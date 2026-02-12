import type { MenuItem } from '@/api/menu.api'

/**
 * Map short locale to BCP-47 for labels lookup
 */
const localeToBcp47: Record<string, string> = {
  uz: 'uz-UZ',
  oz: 'oz-UZ',
  ru: 'ru-RU',
  en: 'en-US',
}

/**
 * Get label for menu item based on current language.
 * Supports 4 languages: uz (Latin), oz (Cyrillic), ru (Russian), en (English)
 *
 * Priority: labels map (BCP-47) → labelXx fields → label → i18nKey → id
 */
export function getMenuLabel(item: MenuItem, lang: string): string {
  const bcp47 = localeToBcp47[lang] || 'uz-UZ'
  const fallbackBcp47 = 'uz-UZ'

  // 1. Try labels map (backend returns this format)
  if (item.labels) {
    return item.labels[bcp47] || item.labels[fallbackBcp47] || item.label || item.i18nKey || item.id
  }

  // 2. Fallback to flat fields (if mapped by frontend)
  switch (lang) {
    case 'oz':
      return item.labelOz || item.labelUz || item.label || item.id
    case 'ru':
      return item.labelRu || item.labelUz || item.label || item.id
    case 'en':
      return item.labelEn || item.labelUz || item.label || item.id
    default:
      return item.labelUz || item.label || item.id
  }
}
