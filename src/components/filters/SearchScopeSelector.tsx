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
    <div className="border-border bg-background flex items-center gap-0 overflow-hidden rounded-lg border">
      {/* Scope Selector */}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="border-border bg-background w-[140px] rounded-none border-0 border-r focus:ring-0 focus:ring-offset-0">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs font-medium">{t('Search')}:</span>
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent className="!border-border !bg-background">
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
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
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
          className="placeholder:text-muted-foreground w-full border-0 bg-transparent py-2.5 pr-10 pl-10 text-sm focus:outline-none"
        />
        {searchValue && (
          <button
            onClick={onClear}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
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
