import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SearchScope {
  value: string
  label: string
  icon?: React.ReactNode
}

interface SearchScopeSelectorProps {
  value: string
  onChange: (value: string) => void
  scopes: SearchScope[]
  searchValue: string
  onSearchChange: (value: string) => void
  onSearch: () => void
  onClear: () => void
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
  const { t } = useTranslation()
  const currentScope = scopes.find((s) => s.value === value)

  return (
    <div className="flex items-center gap-0 overflow-hidden rounded-lg border border-gray-300 bg-white">
      {/* Scope Selector */}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[140px] rounded-none border-0 border-r border-gray-300 bg-white focus:ring-0 focus:ring-offset-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600">{t('Search')}:</span>
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent className="!border-gray-300 !bg-white">
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
      <div className="relative flex-1">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSearch()
            }
          }}
          placeholder={t('Search by {{field}}...', { field: currentScope?.label || t('All') })}
          className="w-full border-0 bg-transparent py-2.5 pr-10 pl-10 text-sm placeholder:text-gray-400 focus:outline-none"
        />
        {searchValue && (
          <button
            onClick={onClear}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
