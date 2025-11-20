import { Search, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SearchScope {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SearchScopeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  scopes: SearchScope[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
}

export function SearchScopeSelector({
  value,
  onChange,
  scopes,
  searchValue,
  onSearchChange,
  onSearch,
  onClear,
}: SearchScopeSelectorProps) {
  const currentScope = scopes.find(s => s.value === value);

  return (
    <div className="flex items-center gap-0 rounded-lg border border-gray-300 bg-white overflow-hidden">
      {/* Scope Selector */}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[140px] border-0 border-r border-gray-300 rounded-none focus:ring-0 focus:ring-offset-0 bg-white">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 font-medium">Qidirish:</span>
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent className="!bg-white !border-gray-300">
          {scopes.map((scope) => (
            <SelectItem key={scope.value} value={scope.value}>
              <div className="flex items-center gap-2">
                {scope.icon}
                <span>{scope.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Search Input */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              onSearch();
            }
          }}
          placeholder={`${currentScope?.label || 'Hamma'} bo'yicha qidirish...`}
          className="w-full pl-10 pr-10 py-2.5 text-sm bg-transparent border-0 focus:outline-none placeholder:text-gray-400"
        />
        {searchValue && (
          <button
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
