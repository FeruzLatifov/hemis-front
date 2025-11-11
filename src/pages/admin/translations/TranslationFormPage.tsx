/**
 * Translation Edit Page
 *
 * View and Edit existing translations (No Create)
 * Path: /system/translation/:id/edit
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  getTranslationById,
  updateTranslation,
  TranslationUpdateRequest,
} from '../../../api/translations.api';

interface FormErrors {
  category?: string;
  messageKey?: string;
  messageUz?: string;
}

export default function TranslationFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState<TranslationUpdateRequest>({
    category: '',
    messageKey: '',
    messageUz: '',
    messageOz: '',
    messageRu: '',
    messageEn: '',
    active: true,
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [error, setError] = useState<string | null>(null);

  // Load existing translation
  useEffect(() => {
    if (id) {
      loadTranslation(id);
    }
  }, [id]);

  const loadTranslation = async (translationId: string) => {
    try {
      setLoadingData(true);
      setError(null);

      const translation = await getTranslationById(translationId);

      // Extract translations by language
      const translations: Record<string, string> = {};
      if (translation.translations && typeof translation.translations === 'object') {
        // Handle new DTO format: { "ru-RU": "text", "en-US": "text" }
        Object.entries(translation.translations).forEach(([lang, text]) => {
          translations[lang] = text as string;
        });
      }

      setFormData({
        category: translation.category,
        messageKey: translation.messageKey,
        messageUz: translation.message, // Default uz-UZ message
        messageOz: translations['oz-UZ'] || '',
        messageRu: translations['ru-RU'] || '',
        messageEn: translations['en-US'] || '',
        active: translation.isActive,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load translation');
      console.error('Error loading translation:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // Validation
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.category.trim()) {
      newErrors.category = 'Kategoriya majburiy';
    }

    if (!formData.messageKey.trim()) {
      newErrors.messageKey = 'Kalit majburiy';
    } else if (!/^[a-z0-9_.]+$/i.test(formData.messageKey)) {
      newErrors.messageKey = 'Kalit faqat harf, raqam, nuqta va pastki chiziqdan iborat bo\'lishi kerak';
    }

    if (!formData.messageUz.trim()) {
      newErrors.messageUz = 'O\'zbek (lotin) majburiy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    if (!id) {
      setError('Translation ID not found');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await updateTranslation(id, formData);
      
      toast.success('✓ Tarjima muvaffaqiyatli yangilandi!', {
        duration: 3000,
        position: 'bottom-right',
      });

      // Redirect to list
      setTimeout(() => {
        navigate('/system/translation');
      }, 500);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to save translation';
      setError(errorMessage);
      toast.error('❌ ' + errorMessage, {
        duration: 5000,
        position: 'bottom-right',
      });
      console.error('Error saving translation:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleChange = (field: keyof TranslationUpdateRequest, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/system/translation');
  };

  if (loadingData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-gray-600 font-medium">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Tarjimani tahrirlash</h1>
        <p className="text-gray-600">Mavjud tarjimani yangilang</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <strong>Xato:</strong> {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg">
        <div className="p-6 space-y-6">
          {/* Category & Key Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategoriya <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.category}
                readOnly
                aria-readonly="true"
                placeholder="menu, button, label, error..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                disabled
              />
              <p className="mt-1 text-xs text-gray-500">
                Masalan: menu, button, label, error, validation
              </p>
            </div>

            {/* Message Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kalit <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.messageKey}
                placeholder="menu.dashboard, button.save..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                readOnly
                aria-readonly="true"
                disabled
              />
              <p className="mt-1 text-xs text-gray-500">
                ⚠️ Kalitni o'zgartirish mumkin emas
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Translations Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Tarjimalar</h2>

            {/* Uzbek (Latin) - Required */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🇺🇿 O'zbek (lotin) <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.messageUz}
                onChange={(e) => handleChange('messageUz', e.target.value)}
                placeholder="Asosiy matn (uz-UZ)"
                rows={3}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.messageUz
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                disabled={loading}
              />
              {errors.messageUz && (
                <p className="mt-1 text-sm text-red-600">{errors.messageUz}</p>
              )}
            </div>

            {/* Uzbek (Cyrillic) - Optional */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🇺🇿 Ўзбек (кирилл)
              </label>
              <textarea
                value={formData.messageOz}
                onChange={(e) => handleChange('messageOz', e.target.value)}
                placeholder="Кирилл ёзуви (oz-UZ)"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            {/* Russian - Optional */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🇷🇺 Русский
              </label>
              <textarea
                value={formData.messageRu}
                onChange={(e) => handleChange('messageRu', e.target.value)}
                placeholder="Русский перевод (ru-RU)"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            {/* English - Optional */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🇬🇧 English
              </label>
              <textarea
                value={formData.messageEn}
                onChange={(e) => handleChange('messageEn', e.target.value)}
                placeholder="English translation (en-US)"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Active Status */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => handleChange('active', e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={loading}
              />
              <span className="text-sm font-medium text-gray-700">
                Aktiv (foydalanish uchun tayyor)
              </span>
            </label>
            <p className="mt-1 ml-8 text-xs text-gray-500">
              Agar faol emas bo'lsa, frontend tarjimani ko'rmaydi
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3 rounded-b-lg">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={loading}
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Saqlanmoqda...' : 'Yangilash'}
          </button>
        </div>
      </form>

      {/* Help Section */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Yordam</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Kategoriya:</strong> Tarjimalar guruhlanishi uchun (menu, button, label...)</li>
          <li>• <strong>Kalit:</strong> Kodda ishlatiladi, o'zgartirish mumkin emas</li>
          <li>• <strong>O'zbek (lotin):</strong> Asosiy til, majburiy</li>
          <li>• <strong>Boshqa tillar:</strong> Ixtiyoriy, lekin tavsiya etiladi</li>
          <li>• <strong>Aktiv:</strong> Agar faol bo'lsa, frontend tarjimani ko'radi</li>
        </ul>
      </div>
    </div>
  );
}
