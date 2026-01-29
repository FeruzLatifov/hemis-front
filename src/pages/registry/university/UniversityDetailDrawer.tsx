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
      } catch {
        setError(t('Failed to load data'));
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
        {/* Header */}
        <div className="bg-[var(--primary)] px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {t('Institution details')}
            </h2>
            <p className="text-blue-100 text-sm mt-0.5">
              {loading ? t('Loading...') : university?.name}
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
        <div className="flex-1 overflow-auto p-6 layout-bg">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-blue-600">
              <Loader2 className="w-10 h-10 animate-spin" />
              <span className="text-sm font-medium">{t('Data is loading')}</span>
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
                {t('Close')}
              </button>
            </div>
          ) : university ? (
            <div className="space-y-6">
              {/* Basic Info - Gradient Card */}
              <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200 shadow-lg">
                <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                  {university.name}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/70 rounded-lg p-3 backdrop-blur-sm">
                    <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">{t('Code')}</span>
                    <p className="text-lg font-bold text-blue-900 mt-1">{university.code}</p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 backdrop-blur-sm">
                    <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">{t('INN')}</span>
                    <p className="text-lg font-bold text-blue-900 mt-1">{university.tin || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-white rounded-xl p-5 border-2 border-gray-200 shadow-sm hover:shadow-md transition">
                <h4 className="font-semibold text-gray-900 mb-4 text-base flex items-center gap-2">
                  <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                  {t('Address and location')}
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">{t('Region')}:</span>
                    <p className="text-gray-900">{university.region || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">{t('Address')}:</span>
                    <p className="text-gray-900">{university.address || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">{t('Mail address')}:</span>
                    <p className="text-gray-900">{university.mailAddress || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">{t('SOATO Region')}:</span>
                    <p className="text-gray-900">{university.soatoRegion || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">{t('Neighborhood')}:</span>
                    <p className="text-gray-900">{university.terrain || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">{t('Cadastre')}:</span>
                    <p className="text-gray-900">{university.cadastre || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Organization Info */}
              <div className="bg-white rounded-xl p-5 border-2 border-gray-200 shadow-sm hover:shadow-md transition">
                <h4 className="font-semibold text-gray-900 mb-4 text-base flex items-center gap-2">
                  <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                  {t('Organizational info')}
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">{t('Ownership')}:</span>
                    <p className="text-gray-900">{university.ownership || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">{t('University type')}:</span>
                    <p className="text-gray-900">{university.universityType || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">{t('Version type')}:</span>
                    <p className="text-gray-900">{university.versionType || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">{t('Contract category')}:</span>
                    <p className="text-gray-900">{university.contractCategory || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">{t('Activity status')}:</span>
                    <p className="text-gray-900">{university.activityStatus || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">{t('Belongs to')}:</span>
                    <p className="text-gray-900">{university.belongsTo || '—'}</p>
                  </div>
                  {university.parentUniversity && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">{t('Main university')}:</span>
                      <p className="text-gray-900">{university.parentUniversity}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* URLs */}
              <div className="bg-white rounded-xl p-5 border-2 border-gray-200 shadow-sm hover:shadow-md transition">
                <h4 className="font-semibold text-gray-900 mb-4 text-base flex items-center gap-2">
                  <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                  {t('Websites')}
                </h4>
                <div className="space-y-3">
                  {university.universityUrl && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">{t('HEI website')}:</span>
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
                      <span className="text-sm font-medium text-gray-600">{t('Teachers portal')}:</span>
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
                      <span className="text-sm font-medium text-gray-600">{t('Students portal')}:</span>
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
                      <span className="text-sm font-medium text-gray-600">{t('UZBMB portal')}:</span>
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
              <div className="bg-indigo-50 rounded-xl p-5 border-2 border-indigo-200 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-4 text-base flex items-center gap-2">
                  <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
                  {t('Settings')}
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
                    <span className="text-sm font-medium">{t('GPA edit')}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/60 rounded-lg p-2 backdrop-blur-sm">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        university.accreditationEdit ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      {university.accreditationEdit && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <span className="text-sm font-medium">{t('Accreditation edit')}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/60 rounded-lg p-2 backdrop-blur-sm">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        university.addStudent ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      {university.addStudent && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <span className="text-sm font-medium">{t('Add student')}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/60 rounded-lg p-2 backdrop-blur-sm">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        university.allowGrouping ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      {university.allowGrouping && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <span className="text-sm font-medium">{t('Allow grouping')}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/60 rounded-lg p-2 backdrop-blur-sm">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        university.allowTransferOutside ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      {university.allowTransferOutside && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <span className="text-sm font-medium">{t('External transfer')}</span>
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
                    <span className="text-sm font-medium">{university.active ? t('Active') : t('Inactive')}</span>
                  </div>
                </div>
              </div>

              {/* Financial & Other Info */}
              <div className="bg-white rounded-xl p-5 border-2 border-gray-200 shadow-sm hover:shadow-md transition">
                <h4 className="font-semibold text-gray-900 mb-4 text-base flex items-center gap-2">
                  <div className="w-1 h-6 bg-teal-500 rounded-full"></div>
                  {t('Additional info')}
                </h4>
                <div className="space-y-3">
                  {university.bankInfo && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">{t('Bank info')}:</span>
                      <p className="text-gray-900 whitespace-pre-wrap">{university.bankInfo}</p>
                    </div>
                  )}
                  {university.accreditationInfo && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">{t('Accreditation')}:</span>
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
            className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] font-medium shadow-lg transition"
          >
            {t('Close')}
          </button>
        </div>
      </div>
    </div>
  );
}

