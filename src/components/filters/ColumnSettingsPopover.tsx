import { Settings2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

interface Column {
  id: string;
  label: string;
  visible: boolean;
  canHide: boolean;
}

interface ColumnSettingsPopoverProps {
  columns: Column[];
  onToggle: (columnId: string) => void;
}

export function ColumnSettingsPopover({ columns, onToggle }: ColumnSettingsPopoverProps) {
  const visibleCount = columns.filter(c => c.visible).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="p-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          title="Ustunlar sozlamalari"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-900">
            Ustunlar sozlamalari
          </h4>
          <p className="text-xs text-gray-600 mt-1">
            Ko'rsatilgan: <span className="font-medium">{visibleCount}</span> / {columns.length}
          </p>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          <div className="space-y-1">
            {columns.map((column) => (
              <label
                key={column.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors ${
                  !column.canHide ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <Checkbox
                  checked={column.visible}
                  onCheckedChange={() => column.canHide && onToggle(column.id)}
                  disabled={!column.canHide}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <span className="text-sm text-gray-700 flex-1">
                  {column.label}
                </span>
                {!column.canHide && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    Majburiy
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => {
              columns.forEach((col) => {
                if (col.canHide && !col.visible) {
                  onToggle(col.id);
                }
              });
            }}
            className="w-full px-3 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Barchasini ko'rsatish
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
