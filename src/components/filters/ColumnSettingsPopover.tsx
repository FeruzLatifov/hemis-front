import { Settings2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'

interface Column {
  id: string
  label: string
  visible: boolean
  canHide: boolean
}

interface ColumnSettingsPopoverProps {
  columns: Column[]
  onToggle: (columnId: string) => void
}

export function ColumnSettingsPopover({ columns, onToggle }: ColumnSettingsPopoverProps) {
  const { t } = useTranslation()
  const visibleCount = columns.filter((c) => c.visible).length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="rounded-lg border border-[var(--border-color-pro)] bg-[var(--card-bg)] p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
          title={t('Column settings')}
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b border-[var(--border-color-pro)] bg-[var(--table-row-alt)] p-4">
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">
            {t('Column settings')}
          </h4>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {t('Shown')}:{' '}
            <span className="font-medium text-[var(--text-primary)]">{visibleCount}</span> /{' '}
            {columns.length}
          </p>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          <div className="space-y-1">
            {columns.map((column) => (
              <label
                key={column.id}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--hover-bg)] ${
                  !column.canHide ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                }`}
              >
                <Checkbox
                  checked={column.visible}
                  onCheckedChange={() => column.canHide && onToggle(column.id)}
                  disabled={!column.canHide}
                  className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                />
                <span className="flex-1 text-sm text-[var(--text-primary)]">{column.label}</span>
                {!column.canHide && (
                  <span className="rounded bg-[var(--table-row-alt)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                    {t('Required')}
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        <div className="border-t border-[var(--border-color-pro)] bg-[var(--table-row-alt)] p-3">
          <button
            onClick={() => {
              columns.forEach((col) => {
                if (col.canHide && !col.visible) {
                  onToggle(col.id)
                }
              })
            }}
            className="w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-950/40"
          >
            {t('Show all')}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
