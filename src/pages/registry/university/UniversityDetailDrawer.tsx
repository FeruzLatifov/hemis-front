import { useState, useEffect } from 'react';
import { universitiesApi, UniversityDetail } from '@/api/universities.api';
import { X, Loader2, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface UniversityDetailDrawerProps {
  universityId: string;
  onClose: () => void;
}

export default function UniversityDetailDrawer({
  universityId,
  onClose,
}: UniversityDetailDrawerProps) {
  const { t } = useTranslation();
  const [university, setUniversity] = useState<UniversityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUniversity = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await universitiesApi.getUniversity(universityId);
        setUniversity(data);
      } catch (err) {
        console.error('Error loading university:', err);
        setError('Ma\'lumotlarni yuklashda xatolik');
      } finally {
        setLoading(false);
      }
    };

    loadUniversity();
  }, [universityId]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-3xl bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
          <h2 className="text-xl font-bold text-white">
            {t('page.university.detail.title') || 'Muassasa ma\'lumotlari'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-600">
              {error}
            </div>
          ) : university ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                <h3 className="text-xl font-bold text-blue-900 mb-4">
                  {university.name}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-blue-700">Kod:</span>
                    <p className="text-lg font-semibold text-blue-900">{university.code}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-blue-700">INN:</span>
                    <p className="text-lg font-semibold text-blue-900">{university.tin || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-white rounded-lg p-5 border">
                <h4 className="font-semibold text-gray-900 mb-4 text-lg">Manzil va joylashuv</h4>
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
              <div className="bg-white rounded-lg p-5 border">
                <h4 className="font-semibold text-gray-900 mb-4 text-lg">Tashkiliy ma'lumotlar</h4>
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
              <div className="bg-white rounded-lg p-5 border">
                <h4 className="font-semibold text-gray-900 mb-4 text-lg">Veb-saytlar</h4>
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
              <div className="bg-white rounded-lg p-5 border">
                <h4 className="font-semibold text-gray-900 mb-4 text-lg">Sozlamalar</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded ${university.gpaEdit ? 'bg-green-500' : 'bg-gray-300'}`}
                    />
                    <span className="text-sm">GPA tahrir</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded ${university.accreditationEdit ? 'bg-green-500' : 'bg-gray-300'}`}
                    />
                    <span className="text-sm">Akkreditatsiya tahrir</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded ${university.addStudent ? 'bg-green-500' : 'bg-gray-300'}`}
                    />
                    <span className="text-sm">Talaba qo'shish</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded ${university.allowGrouping ? 'bg-green-500' : 'bg-gray-300'}`}
                    />
                    <span className="text-sm">Guruhlashga ruxsat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded ${university.allowTransferOutside ? 'bg-green-500' : 'bg-gray-300'}`}
                    />
                    <span className="text-sm">Tashqariga o'tkazishga ruxsat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded ${university.active ? 'bg-green-500' : 'bg-gray-300'}`}
                    />
                    <span className="text-sm">Faol</span>
                  </div>
                </div>
              </div>

              {/* Financial & Other Info */}
              <div className="bg-white rounded-lg p-5 border">
                <h4 className="font-semibold text-gray-900 mb-4 text-lg">Qo'shimcha ma'lumotlar</h4>
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
      </div>
    </>
  );
}

