import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ReportCategory } from '@/api/reports.api'
import { ReportEmptyState } from './ReportEmptyState'
import { formatReportValue } from './formatReportValue'

interface ReportBarChartProps {
  categories?: ReportCategory[] | null
}

/**
 * Thin recharts wrapper for a categorical bar block. Category labels are raw
 * data values (backend-resolved classifier names), so they are NOT t()'d;
 * the empty-state copy is translated inside ReportEmptyState.
 */
export function ReportBarChart({ categories }: ReportBarChartProps) {
  if (!categories || categories.length === 0) {
    return <ReportEmptyState />
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={categories} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color-pro)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
          interval={0}
          angle={-25}
          textAnchor="end"
          height={70}
        />
        <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} allowDecimals={false} />
        <Tooltip
          formatter={(value) =>
            typeof value === 'number' ? formatReportValue(value) : String(value ?? '')
          }
        />
        <Bar dataKey="value" fill="#2F80ED" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
