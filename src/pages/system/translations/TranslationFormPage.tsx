/**
 * Translation Edit Page
 *
 * View and Edit existing translations (No Create)
 * Path: /system/translation/:id/edit
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import {
  searchByMessageText,
  type TranslationUpdateRequest,
  type Translation,
} from '@/api/translations.api'
import { extractApiErrorMessage } from '@/utils/error.util'
import { useTranslation } from 'react-i18next'
import { useUnsavedChanges } from '@/hooks'
import { useTranslationById, useUpdateTranslation } from '@/hooks/useTranslations'

interface FormErrors {
  category?: string
  messageKey?: string
  messageUz?: string
}

export default function TranslationFormPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Fetch translation via hook
  const {
    data: translationData,
    isLoading: loadingData,
    error: fetchError,
  } = useTranslationById(id)

  // Update mutation
  const updateMutation = useUpdateTranslation()

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

  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [similarTranslations, setSimilarTranslations] = useState<Translation[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Warn user about unsaved changes when navigating away
  useUnsavedChanges({
    isDirty,
    message: t('You have unsaved changes. Are you sure you want to leave?'),
  })

  // Populate form when translation data loads
  useEffect(() => {
    if (!translationData) return

    const translations: Record<string, string> = {}
    if (translationData.translations && typeof translationData.translations === 'object') {
      Object.entries(translationData.translations).forEach(([lang, text]) => {
        translations[lang] = String(text)
      })
    }

    setFormData({
      category: translationData.category,
      messageKey: translationData.messageKey,
      messageUz: translationData.message,
      messageOz: translations['oz-UZ'] || '',
      messageRu: translations['ru-RU'] || '',
      messageEn: translations['en-US'] || '',
      active: translationData.isActive,
    })
  }, [translationData])

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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    if (!id) {
      setSubmitError('Translation ID not found')
      return
    }

    setSubmitError(null)

    updateMutation.mutate(
      { id, data: formData },
      {
        onSuccess: () => {
          setIsDirty(false)
          setTimeout(() => {
            navigate('/system/translations')
          }, 500)
        },
        onError: (err: unknown) => {
          const errorMessage = extractApiErrorMessage(err, t('Error saving translation'))
          setSubmitError(errorMessage)
        },
      },
    )
  }

  // Handle input change
  const handleChange = (field: keyof TranslationUpdateRequest, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Mark form as dirty
    setIsDirty(true)

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

  // Derived state
  const loading = updateMutation.isPending
  const error =
    submitError ||
    (fetchError ? extractApiErrorMessage(fetchError, 'Failed to load translation') : null)

  if (loadingData) {
    return (
      <div className="p-6">
        <div className="py-12 text-center">
          <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-muted-foreground font-medium">{t('Loading...')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold">{t('Edit translation')}</h1>
        <p className="text-muted-foreground">{t('Update existing translation')}</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400">
          <strong>{t('Error')}:</strong> {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-card rounded-lg shadow-lg">
        <div className="space-y-6 p-6">
          {/* Category & Key Row */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Category */}
            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">
                {t('Category')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.category}
                readOnly
                aria-readonly="true"
                placeholder="menu, button, label, error..."
                className="border-border bg-muted w-full cursor-not-allowed rounded-lg border px-4 py-2"
                disabled
              />
              <p className="text-muted-foreground mt-1 text-xs">
                {t('Example: menu, button, label, error, validation')}
              </p>
            </div>

            {/* Message Key */}
            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">
                {t('Key')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.messageKey}
                placeholder="Dashboard, Save, Students..."
                className="border-border bg-muted w-full cursor-not-allowed rounded-lg border px-4 py-2"
                readOnly
                aria-readonly="true"
                disabled
              />
              <p className="text-muted-foreground mt-1 text-xs">⚠️ {t('Key cannot be changed')}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-border border-t"></div>

          {/* Translations Section */}
          <div>
            <h2 className="mb-4 text-lg font-semibold">{t('Translations section')}</h2>

            {/* Uzbek (Latin) - Required */}
            <div className="mb-6">
              <label htmlFor="messageUz" className="text-foreground mb-2 block text-sm font-medium">
                🇺🇿 O'zbek (lotin) <span className="text-red-500">*</span>
              </label>
              <textarea
                id="messageUz"
                value={formData.messageUz}
                onChange={(e) => handleChange('messageUz', e.target.value)}
                placeholder={t('Primary text (uz-UZ)')}
                rows={3}
                aria-invalid={!!errors.messageUz}
                aria-describedby={errors.messageUz ? 'messageUz-error' : undefined}
                className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none ${
                  errors.messageUz
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-border focus:ring-blue-500'
                }`}
                disabled={loading}
              />
              {errors.messageUz && (
                <p id="messageUz-error" role="alert" className="mt-1 text-sm text-red-600">
                  {errors.messageUz}
                </p>
              )}

              {/* Similar translations warning */}
              {similarTranslations.length > 0 && (
                <div className="mt-3 rounded-lg border border-amber-400 bg-amber-50 p-3 dark:border-amber-600 dark:bg-amber-950/20">
                  <div className="mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                      {t('Similar translations found')} ({similarTranslations.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {similarTranslations.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-xs">
                        <span className="rounded bg-[var(--primary)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {item.category}
                        </span>
                        <span className="font-mono font-medium text-yellow-900 dark:text-yellow-200">
                          {item.messageKey}
                        </span>
                        <span className="text-yellow-700 dark:text-yellow-400">
                          = "{item.message}"
                        </span>
                      </div>
                    ))}
                    {similarTranslations.length > 5 && (
                      <p className="text-xs text-yellow-700 dark:text-yellow-400">
                        ...{t('and more')} {similarTranslations.length - 5}
                      </p>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-yellow-700 dark:text-yellow-400">
                    {t('If existing translation fits your needs, use it instead of adding new')}
                  </p>
                </div>
              )}
            </div>

            {/* Uzbek (Cyrillic) - Optional */}
            <div className="mb-6">
              <label htmlFor="messageOz" className="text-foreground mb-2 block text-sm font-medium">
                🇺🇿 Ўзбек (кирилл)
              </label>
              <textarea
                id="messageOz"
                value={formData.messageOz}
                onChange={(e) => handleChange('messageOz', e.target.value)}
                placeholder={t('Cyrillic text (oz-UZ)')}
                rows={3}
                className="border-border w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                disabled={loading}
              />
            </div>

            {/* Russian - Optional */}
            <div className="mb-6">
              <label htmlFor="messageRu" className="text-foreground mb-2 block text-sm font-medium">
                🇷🇺 Русский
              </label>
              <textarea
                id="messageRu"
                value={formData.messageRu}
                onChange={(e) => handleChange('messageRu', e.target.value)}
                placeholder={t('Russian translation (ru-RU)')}
                rows={3}
                className="border-border w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                disabled={loading}
              />
            </div>

            {/* English - Optional */}
            <div className="mb-6">
              <label htmlFor="messageEn" className="text-foreground mb-2 block text-sm font-medium">
                🇬🇧 English
              </label>
              <textarea
                id="messageEn"
                value={formData.messageEn}
                onChange={(e) => handleChange('messageEn', e.target.value)}
                placeholder="English translation (en-US)"
                rows={3}
                className="border-border w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                disabled={loading}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-border border-t"></div>

          {/* Active Status */}
          <div>
            <label className="flex cursor-pointer items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => handleChange('active', e.target.checked)}
                className="border-border h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
                disabled={loading}
              />
              <span className="text-foreground text-sm font-medium">
                {t('Active (ready for use)')}
              </span>
            </label>
            <p className="text-muted-foreground mt-1 ml-8 text-xs">
              {t('If inactive, frontend will not see this translation')}
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="border-border bg-muted flex justify-end space-x-3 rounded-b-lg border-t px-6 py-4">
          <button
            type="button"
            onClick={handleCancel}
            className="border-border text-foreground hover:bg-muted rounded-lg border px-6 py-2 focus:ring-2 focus:ring-gray-500 focus:outline-none"
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
      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-950/30">
        <h3 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-300">
          {t('Help section')}
        </h3>
        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-400">
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
