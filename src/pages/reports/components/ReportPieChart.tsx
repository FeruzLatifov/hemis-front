import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { ReportCategory } from '@/api/reports.api'
import { ReportEmptyState } from './ReportEmptyState'

interface ReportPieChartProps {
  categories?: ReportCategory[] | null
}

/** Design-system palette (2 accents max per screen: blues + green/gold tail). */
const PIE_COLORS = [
  '#2F80ED',
  '#27AE60',
  '#F2C94C',
  '#2666BE',
  '#9B51E0',
  '#EB5757',
  '#56CCF2',
  '#6FCF97',
]

/**
 * Thin recharts wrapper for a categorical pie block. Category labels are raw
 * data values, so they are rendered as-is; only empty-state copy is t()'d.
 */
export function ReportPieChart({ categories }: ReportPieChartProps) {
  if (!categories || categories.length === 0) {
    return <ReportEmptyState />
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={categories} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={90}>
          {categories.map((entry, index) => (
            <Cell key={entry.label} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) =>
            typeof value === 'number' ? value.toLocaleString() : String(value ?? '')
          }
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
