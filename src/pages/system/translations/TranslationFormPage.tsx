/**
 * Translation Edit Page
 *
 * View and Edit existing translations (No Create)
 * Path: /system/translation/:id/edit
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'
import {
  getTranslationById,
  updateTranslation,
  searchByMessageText,
  TranslationUpdateRequest,
  Translation,
} from '@/api/translations.api'
import { extractApiErrorMessage } from '@/utils/error.util'
import { useTranslation } from 'react-i18next'

interface FormErrors {
  category?: string
  messageKey?: string
  messageUz?: string
}

export default function TranslationFormPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Form state
  const [formData, setFormData] = useState<TranslationUpdateRequest>({
    category: '',
    messageKey: '',
    messageUz: '',
    messageOz: '',
    messageRu: '',
    messageEn: '',
    active: true,
  })

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [similarTranslations, setSimilarTranslations] = useState<Translation[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadTranslation = useCallback(async (translationId: string) => {
    try {
      setLoadingData(true)
      setError(null)

      const translation = await getTranslationById(translationId)

      // Extract translations by language
      const translations: Record<string, string> = {}
      if (translation.translations && typeof translation.translations === 'object') {
        // Handle new DTO format: { "ru-RU": "text", "en-US": "text" }
        Object.entries(translation.translations).forEach(([lang, text]) => {
          translations[lang] = String(text)
        })
      }

      setFormData({
        category: translation.category,
        messageKey: translation.messageKey,
        messageUz: translation.message, // Default uz-UZ message
        messageOz: translations['oz-UZ'] || '',
        messageRu: translations['ru-RU'] || '',
        messageEn: translations['en-US'] || '',
        active: translation.isActive,
      })
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Failed to load translation'))
    } finally {
      setLoadingData(false)
    }
  }, [])

  // Load existing translation
  useEffect(() => {
    if (id) {
      loadTranslation(id)
    }
  }, [id, loadTranslation])

  // Check for similar translations (debounced)
  const checkSimilar = useCallback(
    (text: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (!text || text.trim().length < 3) {
        setSimilarTranslations([])
        return
      }
      debounceRef.current = setTimeout(async () => {
        try {
          const results = await searchByMessageText(text)
          // Filter out the current translation being edited
          const filtered = results.filter((item) => item.id !== id)
          setSimilarTranslations(filtered)
        } catch {
          // Silently ignore search errors
        }
      }, 600)
    },
    [id],
  )

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // Validation
  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.category.trim()) {
      newErrors.category = t('Category is required')
    }

    if (!formData.messageKey.trim()) {
      newErrors.messageKey = t('Key is required')
    }

    if (!formData.messageUz.trim()) {
      newErrors.messageUz = t('Uzbek (Latin) is required')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    if (!id) {
      setError('Translation ID not found')
      return
    }

    try {
      setLoading(true)
      setError(null)

      await updateTranslation(id, formData)

      toast.success(t('Translation successfully updated'), {
        duration: 3000,
        position: 'bottom-right',
      })

      // Redirect to list
      setTimeout(() => {
        navigate('/system/translations')
      }, 500)
    } catch (err: unknown) {
      // ⭐ Backend-driven i18n: Use backend's localized message
      const errorMessage = extractApiErrorMessage(err, t('Error saving translation'))
      setError(errorMessage)
      toast.error(errorMessage, {
        duration: 5000,
        position: 'bottom-right',
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle input change
  const handleChange = (field: keyof TranslationUpdateRequest, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }))
    }

    // Check for similar translations when message text changes
    if (field === 'messageUz' && typeof value === 'string') {
      checkSimilar(value)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    navigate('/system/translations')
  }

  if (loadingData) {
    return (
      <div className="p-6">
        <div className="py-12 text-center">
          <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="font-medium text-gray-600">{t('Loading...')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold">{t('Edit translation')}</h1>
        <p className="text-gray-600">{t('Update existing translation')}</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <strong>{t('Error')}:</strong> {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-lg bg-white shadow-lg">
        <div className="space-y-6 p-6">
          {/* Category & Key Row */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Category */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t('Category')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.category}
                readOnly
                aria-readonly="true"
                placeholder="menu, button, label, error..."
                className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-50 px-4 py-2"
                disabled
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('Example: menu, button, label, error, validation')}
              </p>
            </div>

            {/* Message Key */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t('Key')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.messageKey}
                placeholder="Dashboard, Save, Students..."
                className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-50 px-4 py-2"
                readOnly
                aria-readonly="true"
                disabled
              />
              <p className="mt-1 text-xs text-gray-500">⚠️ {t('Key cannot be changed')}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Translations Section */}
          <div>
            <h2 className="mb-4 text-lg font-semibold">{t('Translations section')}</h2>

            {/* Uzbek (Latin) - Required */}
            <div className="mb-6">
              <label htmlFor="messageUz" className="mb-2 block text-sm font-medium text-gray-700">
                🇺🇿 O'zbek (lotin) <span className="text-red-500">*</span>
              </label>
              <textarea
                id="messageUz"
                value={formData.messageUz}
                onChange={(e) => handleChange('messageUz', e.target.value)}
                placeholder={t('Primary text (uz-UZ)')}
                rows={3}
                className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none ${
                  errors.messageUz
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                disabled={loading}
              />
              {errors.messageUz && <p className="mt-1 text-sm text-red-600">{errors.messageUz}</p>}

              {/* Similar translations warning */}
              {similarTranslations.length > 0 && (
                <div
                  className="mt-3 rounded-lg border p-3"
                  style={{ backgroundColor: '#FFFBEB', borderColor: '#F59E0B' }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-semibold text-yellow-800">
                      {t('Similar translations found')} ({similarTranslations.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {similarTranslations.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-xs">
                        <span
                          className="rounded px-1.5 py-0.5 font-bold text-white"
                          style={{ backgroundColor: 'var(--primary)', fontSize: '10px' }}
                        >
                          {item.category}
                        </span>
                        <span className="font-mono font-medium text-yellow-900">
                          {item.messageKey}
                        </span>
                        <span className="text-yellow-700">= "{item.message}"</span>
                      </div>
                    ))}
                    {similarTranslations.length > 5 && (
                      <p className="text-xs text-yellow-700">
                        ...{t('and more')} {similarTranslations.length - 5}
                      </p>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-yellow-700">
                    {t('If existing translation fits your needs, use it instead of adding new')}
                  </p>
                </div>
              )}
            </div>

            {/* Uzbek (Cyrillic) - Optional */}
            <div className="mb-6">
              <label htmlFor="messageOz" className="mb-2 block text-sm font-medium text-gray-700">
                🇺🇿 Ўзбек (кирилл)
              </label>
              <textarea
                id="messageOz"
                value={formData.messageOz}
                onChange={(e) => handleChange('messageOz', e.target.value)}
                placeholder={t('Cyrillic text (oz-UZ)')}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                disabled={loading}
              />
            </div>

            {/* Russian - Optional */}
            <div className="mb-6">
              <label htmlFor="messageRu" className="mb-2 block text-sm font-medium text-gray-700">
                🇷🇺 Русский
              </label>
              <textarea
                id="messageRu"
                value={formData.messageRu}
                onChange={(e) => handleChange('messageRu', e.target.value)}
                placeholder={t('Russian translation (ru-RU)')}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                disabled={loading}
              />
            </div>

            {/* English - Optional */}
            <div className="mb-6">
              <label htmlFor="messageEn" className="mb-2 block text-sm font-medium text-gray-700">
                🇬🇧 English
              </label>
              <textarea
                id="messageEn"
                value={formData.messageEn}
                onChange={(e) => handleChange('messageEn', e.target.value)}
                placeholder="English translation (en-US)"
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                disabled={loading}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Active Status */}
          <div>
            <label className="flex cursor-pointer items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => handleChange('active', e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={loading}
              />
              <span className="text-sm font-medium text-gray-700">
                {t('Active (ready for use)')}
              </span>
            </label>
            <p className="mt-1 ml-8 text-xs text-gray-500">
              {t('If inactive, frontend will not see this translation')}
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 rounded-b-lg border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:outline-none"
            disabled={loading}
          >
            {t('Cancel')}
          </button>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
          >
            {loading ? t('Saving...') : t('Update')}
          </button>
        </div>
      </form>

      {/* Help Section */}
      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-blue-900">{t('Help section')}</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>
            • <strong>{t('Category')}:</strong>{' '}
            {t('For grouping translations (menu, button, label...)')}
          </li>
          <li>
            • <strong>{t('Key')}:</strong> {t('Used in code, cannot be changed')}
          </li>
          <li>
            • <strong>{t('Uzbek (latin)')}:</strong> {t('Primary language, required')}
          </li>
          <li>
            • <strong>{t('Other languages')}:</strong> {t('Optional, but recommended')}
          </li>
          <li>
            • <strong>{t('Active')}:</strong> {t('If active, frontend will show the translation')}
          </li>
        </ul>
      </div>
    </div>
  )
}
