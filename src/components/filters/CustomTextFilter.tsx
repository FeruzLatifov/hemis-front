import { useState } from 'react';
import { X, Search } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CustomTextFilterProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  onClose: () => void;
  placeholder?: string;
}

export function CustomTextFilter({ 
  label, 
  value = '', 
  onChange, 
  onClose,
  placeholder = 'Qiymat kiriting...'
}: CustomTextFilterProps) {
  const [open, setOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleApply = () => {
    onChange(tempValue);
    setOpen(false);
  };

  const handleClear = () => {
    setTempValue('');
    onChange('');
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg bg-gray-200 p-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="cursor-pointer hover:text-blue-500 hover:underline text-sm font-medium text-gray-700">
            {label}
            {value && (
              <span className="ml-1 px-1.5 py-0.5 bg-green-600 text-white text-xs rounded-full">
                ✓
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-4" align="start">
          <div className="space-y-4">
            {/* Label */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                {label}
              </label>
            </div>

            {/* Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={placeholder}
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleApply();
                  }
                }}
                className="pl-9"
                autoFocus
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleApply}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                Qo'llash
              </Button>
              <Button
                onClick={handleClear}
                variant="outline"
                size="sm"
              >
                Tozalash
              </Button>
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
