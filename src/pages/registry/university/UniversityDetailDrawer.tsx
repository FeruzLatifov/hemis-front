import { useState, useEffect } from 'react';
import { universitiesApi, UniversityDetail } from '@/api/universities.api';
import { X, Loader2, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface UniversityDetailDrawerProps {
  code: string | null;
  open: boolean;
  onClose: () => void;
}

export default function UniversityDetailDrawer({
  code,
  open,
  onClose,
}: UniversityDetailDrawerProps) {
  const { t } = useTranslation();
  const [university, setUniversity] = useState<UniversityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code || !open) return;

    const loadUniversity = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await universitiesApi.getUniversity(code);
        setUniversity(data);
      } catch (err) {
        console.error('Error loading university:', err);
        setError('Ma\'lumotlarni yuklashda xatolik');
      } finally {
        setLoading(false);
      }
    };

    loadUniversity();
  }, [code, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Modal */}
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {t('page.university.detail.title') || 'Muassasa ma\'lumotlari'}
            </h2>
            <p className="text-blue-100 text-sm mt-0.5">
              {loading ? 'Yuklanmoqda...' : university?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-gradient-to-b from-gray-50 to-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-blue-600">
              <Loader2 className="w-10 h-10 animate-spin" />
              <span className="text-sm font-medium">Ma'lumotlar yuklanmoqda</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-red-600 font-semibold">{error}</p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              >
                Yopish
              </button>
            </div>
          ) : university ? (
            <div className="space-y-6">
              {/* Basic Info - Gradient Card */}
              <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 rounded-xl p-6 border-2 border-blue-200 shadow-lg">
                <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                  {university.name}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/70 rounded-lg p-3 backdrop-blur-sm">
                    <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Kod</span>
                    <p className="text-lg font-bold text-blue-900 mt-1">{university.code}</p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 backdrop-blur-sm">
                    <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">INN</span>
                    <p className="text-lg font-bold text-blue-900 mt-1">{university.tin || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-white rounded-xl p-5 border-2 border-gray-200 shadow-sm hover:shadow-md transition">
                <h4 className="font-semibold text-gray-900 mb-4 text-base flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                  Manzil va joylashuv
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Viloyat:</span>
                    <p className="text-gray-900">{university.region || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Manzil:</span>
                    <p className="text-gray-900">{university.address || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Pochta manzili:</span>
                    <p className="text-gray-900">{university.mailAddress || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">SOATO Region:</span>
                    <p className="text-gray-900">{university.soatoRegion || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Mahalla:</span>
                    <p className="text-gray-900">{university.terrain || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Kadastr:</span>
                    <p className="text-gray-900">{university.cadastre || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Organization Info */}
              <div className="bg-white rounded-xl p-5 border-2 border-gray-200 shadow-sm hover:shadow-md transition">
                <h4 className="font-semibold text-gray-900 mb-4 text-base flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
                  Tashkiliy ma'lumotlar
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Mulkchilik:</span>
                    <p className="text-gray-900">{university.ownership || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Universitet turi:</span>
                    <p className="text-gray-900">{university.universityType || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Versiya turi:</span>
                    <p className="text-gray-900">{university.versionType || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Kontrakt kategoriyasi:</span>
                    <p className="text-gray-900">{university.contractCategory || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Faollik statusi:</span>
                    <p className="text-gray-900">{university.activityStatus || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Tegishli:</span>
                    <p className="text-gray-900">{university.belongsTo || '—'}</p>
                  </div>
                  {university.parentUniversity && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Asosiy universitet:</span>
                      <p className="text-gray-900">{university.parentUniversity}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* URLs */}
              <div className="bg-white rounded-xl p-5 border-2 border-gray-200 shadow-sm hover:shadow-md transition">
                <h4 className="font-semibold text-gray-900 mb-4 text-base flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full"></div>
                  Veb-saytlar
                </h4>
                <div className="space-y-3">
                  {university.universityUrl && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">OTM sayti:</span>
                      <p>
                        <a
                          href={university.universityUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {university.universityUrl}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </p>
                    </div>
                  )}
                  {university.teacherUrl && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">O'qituvchilar portali:</span>
                      <p>
                        <a
                          href={university.teacherUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {university.teacherUrl}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </p>
                    </div>
                  )}
                  {university.studentUrl && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Talabalar portali:</span>
                      <p>
                        <a
                          href={university.studentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {university.studentUrl}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </p>
                    </div>
                  )}
                  {university.uzbmbUrl && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">UZBMB portali:</span>
                      <p>
                        <a
                          href={university.uzbmbUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {university.uzbmbUrl}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Flags & Settings */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border-2 border-indigo-200 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-4 text-base flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                  Sozlamalar
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 bg-white/60 rounded-lg p-2 backdrop-blur-sm">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        university.gpaEdit ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      {university.gpaEdit && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <span className="text-sm font-medium">GPA tahrir</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/60 rounded-lg p-2 backdrop-blur-sm">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        university.accreditationEdit ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      {university.accreditationEdit && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <span className="text-sm font-medium">Akkreditatsiya tahrir</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/60 rounded-lg p-2 backdrop-blur-sm">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        university.addStudent ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      {university.addStudent && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <span className="text-sm font-medium">Talaba qo'shish</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/60 rounded-lg p-2 backdrop-blur-sm">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        university.allowGrouping ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      {university.allowGrouping && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <span className="text-sm font-medium">Guruhlashga ruxsat</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/60 rounded-lg p-2 backdrop-blur-sm">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        university.allowTransferOutside ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      {university.allowTransferOutside && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <span className="text-sm font-medium">Tashqariga o'tkazish</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/60 rounded-lg p-2 backdrop-blur-sm">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        university.active ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    >
                      {university.active && <span className="text-white text-xs font-bold">✓</span>}
                      {!university.active && <span className="text-white text-xs font-bold">✗</span>}
                    </div>
                    <span className="text-sm font-medium">{university.active ? 'Faol' : 'Nofaol'}</span>
                  </div>
                </div>
              </div>

              {/* Financial & Other Info */}
              <div className="bg-white rounded-xl p-5 border-2 border-gray-200 shadow-sm hover:shadow-md transition">
                <h4 className="font-semibold text-gray-900 mb-4 text-base flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-teal-500 to-cyan-500 rounded-full"></div>
                  Qo'shimcha ma'lumotlar
                </h4>
                <div className="space-y-3">
                  {university.bankInfo && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Bank ma'lumotlari:</span>
                      <p className="text-gray-900 whitespace-pre-wrap">{university.bankInfo}</p>
                    </div>
                  )}
                  {university.accreditationInfo && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Akkreditatsiya:</span>
                      <p className="text-gray-900 whitespace-pre-wrap">{university.accreditationInfo}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 font-medium shadow-lg transition"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
}

