import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ReportColumn, ReportRow } from '@/api/reports.api'
import { ReportEmptyState } from './ReportEmptyState'
import { formatReportValue } from './formatReportValue'

interface ReportTableProps {
  columns?: ReportColumn[] | null
  rows?: ReportRow[] | null
}

/**
 * Generic table block driven by the ReportDto contract: the first column is a
 * text label, the rest are numeric (right-aligned + thousands-separated).
 * Column labels are English i18n keys → rendered via t().
 */
export function ReportTable({ columns, rows }: ReportTableProps) {
  const { t } = useTranslation()

  const tableColumns = useMemo<ColumnDef<ReportRow>[]>(() => {
    if (!columns) return []
    return columns.map((col, colIndex) => ({
      id: col.key,
      accessorFn: (row) => row[col.key],
      header: () => <span>{t(col.label)}</span>,
      cell: ({ getValue }) => {
        const value = getValue<string | number>()
        // First column is the row label (text); numeric columns get formatting.
        if (colIndex === 0 || typeof value !== 'number') {
          return <span className="font-medium text-[var(--text-primary)]">{value ?? ''}</span>
        }
        return <span className="tabular-nums">{formatReportValue(value)}</span>
      },
      meta: { numeric: colIndex !== 0 },
    }))
  }, [columns, t])

  const table = useReactTable({
    data: rows ?? [],
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (!columns || columns.length === 0 || !rows || rows.length === 0) {
    return <ReportEmptyState />
  }

  return (
    <div className="max-h-[320px] overflow-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header, index) => (
                <TableHead key={header.id} className={index === 0 ? '' : 'text-right'}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell, index) => (
                <TableCell key={cell.id} className={index === 0 ? '' : 'text-right'}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
