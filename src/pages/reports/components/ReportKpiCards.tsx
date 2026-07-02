import { useTranslation } from 'react-i18next'
import CountUp from 'react-countup'
import { Card, CardContent } from '@/components/ui/card'
import type { ReportKpi } from '@/api/reports.api'

interface ReportKpiCardsProps {
  kpis: ReportKpi[]
}

/**
 * KPI tile row — reuses the DashboardPage tile look (CountUp animated value +
 * secondary label). KPI labels are English i18n keys → rendered via t().
 */
export function ReportKpiCards({ kpis }: ReportKpiCardsProps) {
  const { t } = useTranslation()

  if (kpis.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {kpis.map((kpi) => (
        <Card key={kpi.key} className="border-0 shadow-md transition-all hover:shadow-lg">
          <CardContent className="p-4">
            <p className="mb-1 text-sm font-medium text-[var(--text-secondary)]">{t(kpi.label)}</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              <CountUp
                end={kpi.value}
                duration={2}
                separator=","
                decimals={Number.isInteger(kpi.value) ? 0 : 2}
              />
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
