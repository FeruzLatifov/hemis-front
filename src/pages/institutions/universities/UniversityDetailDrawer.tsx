import { useUniversity } from '@/hooks/useUniversities'
import { sanitizeUrl } from '@/utils/url.util'
import { X, Loader2, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface UniversityDetailDrawerProps {
  code: string | null
  open: boolean
  onClose: () => void
}

export default function UniversityDetailDrawer({
  code,
  open,
  onClose,
}: UniversityDetailDrawerProps) {
  const { t } = useTranslation()
  const { data: university, isLoading: loading, isError } = useUniversity(code ?? '')
  const error = isError ? t('Failed to load data') : null

  if (!open) return null

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-200"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className="animate-in zoom-in-95 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl duration-300"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="document"
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-[var(--primary)] px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold text-white">{t('Institution details')}</h2>
            <p className="mt-0.5 text-sm text-blue-100">
              {loading ? t('Loading...') : university?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white transition hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="layout-bg flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-blue-600">
              <Loader2 className="h-10 w-10 animate-spin" />
              <span className="text-sm font-medium">{t('Data is loading')}</span>
            </div>
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <X className="h-8 w-8 text-red-500" />
              </div>
              <p className="font-semibold text-red-600">{error}</p>
              <button
                onClick={onClose}
                className="mt-2 rounded-lg bg-gray-200 px-5 py-2 text-gray-700 transition hover:bg-gray-300"
              >
                {t('Close')}
              </button>
            </div>
          ) : university ? (
            <div className="space-y-6">
              {/* Basic Info - Gradient Card */}
              <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-6 shadow-lg">
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-blue-900">
                  <div className="h-8 w-2 rounded-full bg-blue-500"></div>
                  {university.name}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-white/70 p-3 backdrop-blur-sm">
                    <span className="text-xs font-medium tracking-wide text-blue-600 uppercase">
                      {t('Code')}
                    </span>
                    <p className="mt-1 text-lg font-bold text-blue-900">{university.code}</p>
                  </div>
                  <div className="rounded-lg bg-white/70 p-3 backdrop-blur-sm">
                    <span className="text-xs font-medium tracking-wide text-blue-600 uppercase">
                      {t('INN')}
                    </span>
                    <p className="mt-1 text-lg font-bold text-blue-900">{university.tin || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <h4 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
                  <div className="h-6 w-1 rounded-full bg-blue-500"></div>
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
              <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <h4 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
                  <div className="h-6 w-1 rounded-full bg-green-500"></div>
                  {t('Organizational info')}
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">{t('Ownership')}:</span>
                    <p className="text-gray-900">{university.ownership || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">
                      {t('University type')}:
                    </span>
                    <p className="text-gray-900">{university.universityType || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">{t('Version type')}:</span>
                    <p className="text-gray-900">{university.versionType || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">
                      {t('Contract category')}:
                    </span>
                    <p className="text-gray-900">{university.contractCategory || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">
                      {t('Activity status')}:
                    </span>
                    <p className="text-gray-900">{university.activityStatus || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">{t('Belongs to')}:</span>
                    <p className="text-gray-900">{university.belongsTo || '—'}</p>
                  </div>
                  {university.parentUniversity && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        {t('Main university')}:
                      </span>
                      <p className="text-gray-900">{university.parentUniversity}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* URLs */}
              <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <h4 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
                  <div className="h-6 w-1 rounded-full bg-orange-500"></div>
                  {t('Websites')}
                </h4>
                <div className="space-y-3">
                  {sanitizeUrl(university.universityUrl) && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">{t('HEI website')}:</span>
                      <p>
                        <a
                          href={sanitizeUrl(university.universityUrl)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          {university.universityUrl}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </p>
                    </div>
                  )}
                  {sanitizeUrl(university.teacherUrl) && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        {t('Teachers portal')}:
                      </span>
                      <p>
                        <a
                          href={sanitizeUrl(university.teacherUrl)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          {university.teacherUrl}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </p>
                    </div>
                  )}
                  {sanitizeUrl(university.studentUrl) && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        {t('Students portal')}:
                      </span>
                      <p>
                        <a
                          href={sanitizeUrl(university.studentUrl)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          {university.studentUrl}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </p>
                    </div>
                  )}
                  {sanitizeUrl(university.uzbmbUrl) && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        {t('UZBMB portal')}:
                      </span>
                      <p>
                        <a
                          href={sanitizeUrl(university.uzbmbUrl)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          {university.uzbmbUrl}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Flags & Settings */}
              <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-5 shadow-sm">
                <h4 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
                  <div className="h-6 w-1 rounded-full bg-blue-500"></div>
                  {t('Settings')}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 rounded-lg bg-white/60 p-2 backdrop-blur-sm">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full ${
                        university.gpaEdit ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      {university.gpaEdit && (
                        <span className="text-xs font-bold text-white">✓</span>
                      )}
                    </div>
                    <span className="text-sm font-medium">{t('GPA edit')}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-white/60 p-2 backdrop-blur-sm">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full ${
                        university.accreditationEdit ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      {university.accreditationEdit && (
                        <span className="text-xs font-bold text-white">✓</span>
                      )}
                    </div>
                    <span className="text-sm font-medium">{t('Accreditation edit')}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-white/60 p-2 backdrop-blur-sm">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full ${
                        university.addStudent ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      {university.addStudent && (
                        <span className="text-xs font-bold text-white">✓</span>
                      )}
                    </div>
                    <span className="text-sm font-medium">{t('Add student')}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-white/60 p-2 backdrop-blur-sm">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full ${
                        university.allowGrouping ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      {university.allowGrouping && (
                        <span className="text-xs font-bold text-white">✓</span>
                      )}
                    </div>
                    <span className="text-sm font-medium">{t('Allow grouping')}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-white/60 p-2 backdrop-blur-sm">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full ${
                        university.allowTransferOutside ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      {university.allowTransferOutside && (
                        <span className="text-xs font-bold text-white">✓</span>
                      )}
                    </div>
                    <span className="text-sm font-medium">{t('External transfer')}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-white/60 p-2 backdrop-blur-sm">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full ${
                        university.active ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    >
                      {university.active && <span className="text-xs font-bold text-white">✓</span>}
                      {!university.active && (
                        <span className="text-xs font-bold text-white">✗</span>
                      )}
                    </div>
                    <span className="text-sm font-medium">
                      {university.active ? t('Active') : t('Inactive')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial & Other Info */}
              <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <h4 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
                  <div className="h-6 w-1 rounded-full bg-teal-500"></div>
                  {t('Additional info')}
                </h4>
                <div className="space-y-3">
                  {university.bankInfo && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">{t('Bank info')}:</span>
                      <p className="whitespace-pre-wrap text-gray-900">{university.bankInfo}</p>
                    </div>
                  )}
                  {university.accreditationInfo && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        {t('Accreditation')}:
                      </span>
                      <p className="whitespace-pre-wrap text-gray-900">
                        {university.accreditationInfo}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t bg-gray-50 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-[var(--primary)] px-6 py-2 font-medium text-white shadow-lg transition hover:bg-[var(--primary-hover)]"
          >
            {t('Close')}
          </button>
        </div>
      </div>
    </div>
  )
}
