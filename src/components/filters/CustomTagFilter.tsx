import { useState } from 'react';
import { X, Search } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

interface Dictionary {
  code: string;
  name: string;
}

interface CustomTagFilterProps {
  label: string;
  data: Dictionary[];
  value: string[];
  onChange: (value: string[]) => void;
  onClose: () => void;
}

export function CustomTagFilter({ 
  label, 
  data, 
  value, 
  onChange, 
  onClose 
}: CustomTagFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);

  const allCodes = data.map(item => item.code);
  const isAllSelected = value.length === allCodes.length && allCodes.length > 0;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onChange([]);
    } else {
      onChange(allCodes);
    }
  };

  const handleToggleItem = (code: string) => {
    if (value.includes(code)) {
      onChange(value.filter(c => c !== code));
    } else {
      onChange([...value, code]);
    }
  };

  const filteredData = data.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex items-center gap-2 rounded-lg bg-gray-200 p-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="cursor-pointer hover:text-blue-500 hover:underline text-sm font-medium text-gray-700">
            {label}
            {value.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                {value.length}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="grid max-h-[400px] grid-rows-[auto_1fr] overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white p-4 border-b">
              {/* Select All */}
              <div className="flex items-center gap-2 mb-3">
                <Checkbox
                  id="select-all"
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Barchasini tanlang
                </label>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Items List */}
            <div className="overflow-auto p-4">
              <div className="flex flex-col gap-2">
                {filteredData.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Hech narsa topilmadi
                  </p>
                ) : (
                  filteredData.map((item) => (
                    <div key={item.code} className="flex items-center gap-2">
                      <Checkbox
                        id={`item-${item.code}`}
                        checked={value.includes(item.code)}
                        onCheckedChange={() => handleToggleItem(item.code)}
                      />
                      <label
                        htmlFor={`item-${item.code}`}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {item.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="cursor-pointer rounded-full bg-red-50 p-1 text-red-500 hover:bg-red-100 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
