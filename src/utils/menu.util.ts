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
 *
 * Priority: labels map (BCP-47) → label → i18nKey → id
 */
export function getMenuLabel(item: MenuItem, lang: string): string {
  const bcp47 = localeToBcp47[lang] || 'uz-UZ'

  // Primary: labels map (backend always provides this)
  if (item.labels) {
    return item.labels[bcp47] || item.labels['uz-UZ'] || item.label || item.i18nKey || item.id
  }

  // Fallback: label field or i18nKey
  return item.label || item.i18nKey || item.id
}
