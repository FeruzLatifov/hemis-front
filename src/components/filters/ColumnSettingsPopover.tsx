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
          className="border-border bg-background text-foreground hover:bg-muted rounded-lg border p-2 transition-colors"
          title={t('Column settings')}
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-border bg-muted border-b p-4">
          <h4 className="text-foreground text-sm font-semibold">{t('Column settings')}</h4>
          <p className="text-muted-foreground mt-1 text-xs">
            {t('Shown')}: <span className="font-medium">{visibleCount}</span> / {columns.length}
          </p>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          <div className="space-y-1">
            {columns.map((column) => (
              <label
                key={column.id}
                className={`hover:bg-muted flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                  !column.canHide ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                }`}
              >
                <Checkbox
                  checked={column.visible}
                  onCheckedChange={() => column.canHide && onToggle(column.id)}
                  disabled={!column.canHide}
                  className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                />
                <span className="text-foreground flex-1 text-sm">{column.label}</span>
                {!column.canHide && (
                  <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs">
                    {t('Required')}
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        <div className="border-border bg-muted border-t p-3">
          <button
            onClick={() => {
              columns.forEach((col) => {
                if (col.canHide && !col.visible) {
                  onToggle(col.id)
                }
              })
            }}
            className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-950/40"
          >
            {t('Show all')}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
