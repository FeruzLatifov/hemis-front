import { getMenuLabel } from '../menu.util'
import type { MenuItem } from '@/api/menu.api'

const mockItem: MenuItem = {
  id: '1',
  label: 'Test',
  labels: {
    'uz-UZ': 'Bosh sahifa',
    'oz-UZ': 'Бош саҳифа',
    'ru-RU': 'Главная',
    'en-US': 'Home',
  },
}

const itemWithMissingTranslations: MenuItem = {
  id: '2',
  label: 'Partial',
  labels: {
    'uz-UZ': 'Faqat uzbekcha',
    'oz-UZ': '',
    'ru-RU': '',
    'en-US': '',
  },
}

describe('getMenuLabel', () => {
  it('returns uz label for "uz" language', () => {
    expect(getMenuLabel(mockItem, 'uz')).toBe('Bosh sahifa')
  })

  it('returns oz label for "oz" language', () => {
    expect(getMenuLabel(mockItem, 'oz')).toBe('Бош саҳифа')
  })

  it('returns ru label for "ru" language', () => {
    expect(getMenuLabel(mockItem, 'ru')).toBe('Главная')
  })

  it('returns en label for "en" language', () => {
    expect(getMenuLabel(mockItem, 'en')).toBe('Home')
  })

  it('falls back to uz for unknown language', () => {
    expect(getMenuLabel(mockItem, 'fr')).toBe('Bosh sahifa')
  })

  it('falls back to uz-UZ when oz is empty', () => {
    expect(getMenuLabel(itemWithMissingTranslations, 'oz')).toBe('Faqat uzbekcha')
  })

  it('falls back to uz-UZ when ru is empty', () => {
    expect(getMenuLabel(itemWithMissingTranslations, 'ru')).toBe('Faqat uzbekcha')
  })

  it('falls back to uz-UZ when en is empty', () => {
    expect(getMenuLabel(itemWithMissingTranslations, 'en')).toBe('Faqat uzbekcha')
  })
})
