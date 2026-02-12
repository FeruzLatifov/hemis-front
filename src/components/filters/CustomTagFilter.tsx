import { useState } from 'react'
import { X, Search, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'

interface Dictionary {
  code: string
  name: string
}

interface CustomTagFilterProps {
  label: string
  data: Dictionary[]
  value: string[]
  onChange: (value: string[]) => void
  onClose?: () => void
  /** When true, only one item can be selected at a time (radio behavior) */
  singleSelect?: boolean
}

export function CustomTagFilter({
  label,
  data,
  value,
  onChange,
  onClose,
  singleSelect,
}: CustomTagFilterProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [open, setOpen] = useState(false)

  const selectedSet = new Set(value)
  const hasSelection = selectedSet.size > 0

  const selectedNames = value.map((code) => data.find((d) => d.code === code)?.name).filter(Boolean)

  const handleToggleItem = (code: string) => {
    if (singleSelect) {
      // Radio behavior: select or deselect the clicked item
      onChange(selectedSet.has(code) ? [] : [code])
      setOpen(false)
      return
    }
    if (selectedSet.has(code)) {
      onChange(value.filter((v) => v !== code))
    } else {
      onChange([...value, code])
    }
  }

  const handleClear = () => {
    onChange([])
  }

  const handleSelectAll = () => {
    handleClear()
    setOpen(false)
  }

  const filteredData = data.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Display text for trigger
  const displayText = () => {
    if (!hasSelection) return <span className="text-gray-400">{t('All')}</span>
    if (selectedNames.length === 1) {
      return (
        <span className="max-w-[140px] truncate font-medium text-[var(--primary)]">
          {selectedNames[0]}
        </span>
      )
    }
    return (
      <span className="font-medium text-[var(--primary)]">
        {selectedNames[0]}
        <span className="ml-1 rounded-sm bg-[var(--primary)]/10 px-1 text-[10px]">
          +{selectedNames.length - 1}
        </span>
      </span>
    )
  }

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="inline-flex items-center gap-1.5 text-sm text-gray-600 transition-colors hover:text-gray-900">
            <span className="text-xs font-medium text-gray-400">{label}:</span>
            {displayText()}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <div className="grid max-h-[350px] grid-rows-[auto_1fr] overflow-hidden">
            {/* Search */}
            <div className="border-b p-3">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder={t('Search...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                />
              </div>
            </div>

            {/* Items */}
            <div className="overflow-auto">
              {/* Show all option */}
              <button
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                  !hasSelection
                    ? 'bg-[var(--active-bg)] font-medium text-[var(--primary)]'
                    : 'text-gray-700'
                }`}
                onClick={handleSelectAll}
              >
                {t('All')}
                {!hasSelection && <Check className="h-4 w-4 text-[var(--primary)]" />}
              </button>

              <div className="border-t border-gray-100" />

              {filteredData.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-500">{t('No results found')}</p>
              ) : (
                filteredData.map((item) => {
                  const isSelected = selectedSet.has(item.code)
                  return (
                    <button
                      key={item.code}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                        isSelected ? 'font-medium text-[var(--primary)]' : 'text-gray-700'
                      }`}
                      onClick={() => handleToggleItem(item.code)}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center ${singleSelect ? 'rounded-full' : 'rounded'} border transition-colors ${
                          isSelected
                            ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </span>
                      <span className="flex-1 truncate">{item.name}</span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear selected values */}
      {hasSelection && (
        <button
          onClick={handleClear}
          className="rounded-full p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          title={t('Clear')}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {/* Remove filter (only when onClose provided and nothing selected) */}
      {!hasSelection && onClose && (
        <button
          onClick={onClose}
          className="rounded-full p-0.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
          title={t('Remove filter')}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
