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
          className="rounded-lg border border-gray-300 bg-white p-2 text-gray-700 transition-colors hover:bg-gray-50"
          title={t('Column settings')}
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <h4 className="text-sm font-semibold text-gray-900">{t('Column settings')}</h4>
          <p className="mt-1 text-xs text-gray-600">
            {t('Shown')}: <span className="font-medium">{visibleCount}</span> / {columns.length}
          </p>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          <div className="space-y-1">
            {columns.map((column) => (
              <label
                key={column.id}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50 ${
                  !column.canHide ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                }`}
              >
                <Checkbox
                  checked={column.visible}
                  onCheckedChange={() => column.canHide && onToggle(column.id)}
                  disabled={!column.canHide}
                  className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                />
                <span className="flex-1 text-sm text-gray-700">{column.label}</span>
                {!column.canHide && (
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    {t('Required')}
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 bg-gray-50 p-3">
          <button
            onClick={() => {
              columns.forEach((col) => {
                if (col.canHide && !col.visible) {
                  onToggle(col.id)
                }
              })
            }}
            className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
          >
            {t('Show all')}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
