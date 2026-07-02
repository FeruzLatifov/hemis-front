import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { Loader2, RefreshCw, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUniversities } from '@/hooks/useUniversities'
import type { ReportBlock, ReportDto } from '@/api/reports.api'
import { ReportKpiCards } from './ReportKpiCards'
import { ReportBarChart } from './ReportBarChart'
import { ReportPieChart } from './ReportPieChart'
import { ReportTable } from './ReportTable'

/** Sentinel for the "all universities" option (Radix Select forbids empty value). */
export const ALL_UNIVERSITIES = '__all__'

interface ReportFilterConfig {
  educationYear?: boolean
  university?: boolean
}

interface ReportViewProps {
  /** English i18n key for the page heading. */
  title: string
  data?: ReportDto
  isLoading: boolean
  isError: boolean
  onRetry?: () => void
  filters?: ReportFilterConfig
  /** Optional report-specific filter controls (e.g. education type, degree). */
  extraFilters?: ReactNode
}

/** Current academic year: rolls over in September. */
function currentAcademicYear(): number {
  const now = new Date()
  return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
}

function yearOptions(): number[] {
  const current = currentAcademicYear()
  return Array.from({ length: 6 }, (_, i) => current - i)
}

function dispatchBlock(block: ReportBlock): ReactNode {
  switch (block.viz) {
    case 'bar':
      return <ReportBarChart categories={block.categories} />
    case 'pie':
      return <ReportPieChart categories={block.categories} />
    case 'table':
      return <ReportTable columns={block.columns} rows={block.rows} />
    default:
      return null
  }
}

/**
 * Shared analytics report shell: filter bar (URL-backed) → KPI row → responsive
 * grid of viz blocks. Every report renders through this ONE component; only the
 * data + which filters to show differ per report.
 */
export function ReportView({
  title,
  data,
  isLoading,
  isError,
  onRetry,
  filters = { educationYear: true, university: true },
  extraFilters,
}: ReportViewProps) {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const { data: universitiesPage } = useUniversities(
    { page: 0, size: 500 },
    { enabled: !!filters.university },
  )
  const universities = universitiesPage?.content ?? []

  const selectedYear = searchParams.get('educationYear') ?? String(currentAcademicYear())
  const selectedUniversity = searchParams.get('universityCode') ?? ALL_UNIVERSITIES

  const updateParam = (key: string, value: string | null) => {
    setSearchParams(
      (prev) => {
        if (value === null) prev.delete(key)
        else prev.set(key, value)
        return prev
      },
      { replace: true },
    )
  }

  const hasActiveFilters =
    searchParams.has('educationYear') ||
    searchParams.has('universityCode') ||
    searchParams.has('educationType') ||
    searchParams.has('academicDegree')

  const resetFilters = () => setSearchParams({}, { replace: true })

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">{t(title)}</h1>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-4 rounded-[6px] border border-[var(--border-color-pro)] bg-[var(--card-bg)] p-4">
        {filters.educationYear && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--text-secondary)]" htmlFor="report-year">
              {t('Education year')}
            </label>
            <Select value={selectedYear} onValueChange={(v) => updateParam('educationYear', v)}>
              <SelectTrigger id="report-year" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions().map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}/{year + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {filters.university && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--text-secondary)]" htmlFor="report-university">
              {t('University')}
            </label>
            <Select
              value={selectedUniversity}
              onValueChange={(v) =>
                updateParam('universityCode', v === ALL_UNIVERSITIES ? null : v)
              }
            >
              <SelectTrigger id="report-university" className="w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_UNIVERSITIES}>{t('All')}</SelectItem>
                {universities.map((u) => (
                  <SelectItem key={u.code} value={u.code}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {extraFilters}

        {hasActiveFilters && (
          <Button variant="outline" onClick={resetFilters}>
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
            {t('Reset')}
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[var(--primary)]" />
        </div>
      )}

      {isError && !isLoading && (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <p className="text-[var(--text-secondary)]">{t('Failed to load data')}</p>
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              {t('Retry')}
            </Button>
          )}
        </div>
      )}

      {!isLoading && !isError && data && (
        <>
          <ReportKpiCards kpis={data.kpis} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {data.blocks.map((block) => (
              <Card
                key={block.key}
                className={`border-0 shadow-md ${block.viz === 'table' ? 'lg:col-span-2' : ''}`}
              >
                <CardHeader>
                  <CardTitle className="text-base">{t(block.title)}</CardTitle>
                </CardHeader>
                <CardContent>{dispatchBlock(block)}</CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
